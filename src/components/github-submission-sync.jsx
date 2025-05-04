import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Switch } from "@components/ui/switch";
import { Button } from "@components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { useToast } from "@hooks/use-toast";
import { Loader2, Settings2, Plus, GitPullRequestArrow } from "lucide-react";
import DisconnectGitHubAccount from "@components/disconnect-github-account";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

const setChromeStorage = (data) => new Promise((resolve) => chrome.storage.sync.set(data, resolve));
const getChromeStorage = (keys) => new Promise((resolve) => chrome.storage.sync.get(keys, resolve));
const removeChromeStorage = (key) => new Promise((resolve) => chrome.storage.sync.remove(key, resolve));

const repoFormSchema = z.object({
    repoName: z
        .string()
        .min(1, "Repository name is required")
        .max(100, "Repository name must be less than 100 characters")
        .regex(/^[a-zA-Z0-9._-]+$/, {
            message: "Repository name can only contain letters, numbers, periods, hyphens, and underscores",
        }),
});

const GitHubSubmissionSync = () => {
    const { toast } = useToast();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [creatingRepo, setCreatingRepo] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState({ id: null, name: "" });
    const [userData, setUserData] = useState({
        githubAccessToken: "",
        githubName: "",
        avatarUrl: "",
        repos: [],
    });

    const form = useForm({
        resolver: zodResolver(repoFormSchema),
        defaultValues: { repoName: "" },
    });

    const checkGitHubAuth = useCallback(async () => {
        try {
            setIsDataLoading(true);
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: "isGitHubAuthenticated" }, (res) => resolve(res));
            });

            setIsAuthenticated(response);

            if (response) {
                const { github_access_token, github_user_data, selected_repo_id, sync_enabled } =
                    await getChromeStorage([
                        "github_access_token",
                        "github_user_data",
                        "selected_repo_id",
                        "sync_enabled",
                    ]);

                setUserData({
                    githubAccessToken: github_access_token,
                    githubName: github_user_data.github_name,
                    avatarUrl: github_user_data.avatar_url,
                    repos: github_user_data.repos || [],
                });

                setSyncEnabled(!!sync_enabled);

                if (selected_repo_id) {
                    const selected = github_user_data.repos?.find(
                        (repo) => repo.id.toString() === selected_repo_id.toString(),
                    );
                    if (selected) setSelectedRepo({ id: selected_repo_id, name: selected.name });
                }
            }
        } catch (error) {
            console.error("Authentication check failed", error);
            setIsAuthenticated(false);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    const handleGitHubAuth = useCallback(async () => {
        setIsActionLoading(true);
        const redirectURL = chrome.identity.getRedirectURL();
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectURL}&scope=read:user%20repo`;

        try {
            const responseUrl = await new Promise((resolve, reject) => {
                chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (response) => {
                    if (chrome.runtime.lastError || !response) {
                        reject(new Error(chrome.runtime.lastError?.message || "Authentication failed"));
                    }
                    resolve(response);
                });
            });

            const code = new URLSearchParams(new URL(responseUrl).search).get("code");
            if (!code) throw new Error("No authorization code received");

            const { data } = await axios.post(`${API_URL}/github/access-token`, { code: code });
            await setChromeStorage({ github_access_token: data.github_access_token });

            toast({ title: "Authentication Success", description: "Successfully authenticated with GitHub" });
            await checkGitHubAuth();
        } catch (error) {
            console.error("GitHub Auth failed", error);
            toast({
                title: "Authentication Failed",
                description: "Failed to authenticate with GitHub",
                variant: "destructive",
            });
        } finally {
            setIsActionLoading(false);
        }
    }, [checkGitHubAuth, toast]);

    const handleCreateRepo = async (values) => {
        try {
            setCreatingRepo(true);
            const response = await axios.post(`${API_URL}/user/github/repo`, {
                repo_name: values.repoName,
                github_access_token: userData.githubAccessToken,
            });

            const newRepo = { id: response.data.repo_id, name: values.repoName };

            setUserData((prev) => ({
                ...prev,
                repos: [...prev.repos, newRepo],
            }));
            setSelectedRepo(newRepo);
            await setChromeStorage({ selected_repo_id: newRepo.id });

            form.reset();
            toast({
                title: "Success",
                description: `Created and selected repository: ${values.repoName}`,
            });
        } catch (error) {
            console.error("Error creating repository", error);
            toast({
                title: "Error",
                description:
                    error.response?.status === 400 ? "Repository name already exists" : "Cannot create repository",
                variant: "destructive",
            });
        } finally {
            setCreatingRepo(false);
        }
    };

    const handleToggleSync = async (checked) => {
        await setChromeStorage({ sync_enabled: checked });
        setSyncEnabled(checked);

        if (!checked) {
            await removeChromeStorage("selected_repo_id");
            setSelectedRepo({ id: null, name: "" });
        } else if (userData.repos.length > 0) {
            const firstRepo = userData.repos[0];
            await setChromeStorage({ selected_repo_id: firstRepo.id });
            setSelectedRepo({ id: firstRepo.id, name: firstRepo.name });
        }
    };

    const handleRepoSelect = async (repoId) => {
        const selected = userData.repos.find((repo) => repo.id.toString() === repoId.toString());
        await setChromeStorage({ selected_repo_id: repoId });
        setSelectedRepo({ id: repoId, name: selected?.name || "" });
    };

    useEffect(() => {
        checkGitHubAuth();
    }, [checkGitHubAuth]);

    if (isDataLoading) {
        return (
            <Card className="animate-pulse">
                <CardHeader>Loading GitHub Sync Info...</CardHeader>
            </Card>
        );
    }

    if (!isAuthenticated) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                        <GitPullRequestArrow className="w-5 h-5 mr-2" />
                        Sync LeetCode with GitHub?
                    </CardTitle>
                    <CardDescription>
                        Connect your GitHub account to sync your successful LeetCode submissions to a GitHub
                        repository!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleGitHubAuth}
                        className="w-full"
                        size="sm"
                        variant="outline"
                        disabled={isActionLoading}
                    >
                        {isActionLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <>
                                <img src="/github_octocat.svg" alt="GitHub Logo" className="h-4 w-4" />
                                Sign in with GitHub
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className={syncEnabled ? "pb-3" : "pb-5"}>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center space-x-3">
                        <Avatar>
                            <AvatarImage src={userData.avatarUrl} />
                            <AvatarFallback>{userData.githubName?.[0]}</AvatarFallback>
                        </Avatar>
                        <CardTitle>{userData.githubName}</CardTitle>
                    </div>
                    <div>
                        <DisconnectGitHubAccount />
                    </div>
                </div>
                <div className="flex items-center justify-between space-x-3 pt-1">
                    <p className="text-sm text-muted-foreground">
                        {syncEnabled
                            ? selectedRepo.id
                                ? `Currently syncing with: ${selectedRepo.name}`
                                : "Select or create a repository to start syncing"
                            : "Enable to start syncing LeetCode submissions to a GitHub repository"}
                    </p>
                    <Switch checked={syncEnabled} onCheckedChange={handleToggleSync} />
                </div>
            </CardHeader>

            {syncEnabled && (
                <CardContent>
                    <Tabs defaultValue={userData.repos.length > 0 ? "select" : "create"}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="select">
                                <Settings2 className="w-4 h-4 mr-2" />
                                Select Repo
                            </TabsTrigger>
                            <TabsTrigger value="create">
                                <Plus className="w-4 h-4 mr-2" />
                                New Repo
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="select" className="mt-4">
                            {userData.repos.length === 0 ? (
                                <Alert>
                                    <AlertTitle>No repositories found</AlertTitle>
                                    <AlertDescription>
                                        Create a new repository to get started with syncing.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Select value={selectedRepo.id?.toString()} onValueChange={handleRepoSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedRepo.name || "Choose a repository"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {userData.repos.map(({ id, name }) => (
                                            <SelectItem key={id} value={id.toString()}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </TabsContent>

                        <TabsContent value="create" className="mt-4">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleCreateRepo)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="repoName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter repository name"
                                                        disabled={creatingRepo}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={creatingRepo}
                                        className="w-full"
                                    >
                                        {creatingRepo ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Create Repository
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            )}
        </Card>
    );
};

export default GitHubSubmissionSync;
