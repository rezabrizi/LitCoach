import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Switch } from "@components/ui/switch";
import { Button } from "@components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import ReportIssueButton from "@components/report-issue";
import SubscriptionCard from "@components/subscription-card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@hooks/use-toast";
import axios from "axios";
import { Loader2, Settings2, Plus } from "lucide-react";
import { z } from "zod";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const repoFormSchema = z.object({
    repoName: z
        .string()
        .min(1, "Repository name is required")
        .max(100, "Repository name must be less than 100 characters")
        .regex(/^[a-zA-Z0-9._-]+$/, {
            message: "Repository name can only contain letters, numbers, periods, hyphens, and underscores",
        }),
});

const App = () => {
    const { toast } = useToast();
    const [userData, setUserData] = useState({
        userID: "",
        githubName: "",
        avatarUrl: "",
        repos: [],
    });
    const [selectedRepo, setSelectedRepo] = useState({ id: null, name: "" });
    const [creatingRepo, setCreatingRepo] = useState(false);

    const form = useForm({
        resolver: zodResolver(repoFormSchema),
        defaultValues: { repoName: "" },
    });

    useEffect(() => {
        const fetchUserData = async () => {
            const data = await new Promise((resolve) => {
                chrome.storage.sync.get(["user_data", "user_id", "selected_repo_id"], resolve);
            });

            const { user_data, user_id, selected_repo_id } = data;

            setUserData({
                userID: user_id,
                githubName: user_data.github_name,
                avatarUrl: user_data.avatar_url,
                hasPremium: user_data.has_premium,
                repos: user_data.repos,
                billingDate: user_data.billing_date,
            });

            if (selected_repo_id) {
                const selectedRepo = user_data.repos.find(
                    (repo) => repo.id.toString() === selected_repo_id.toString(),
                );
                setSelectedRepo({
                    id: selected_repo_id,
                    name: selectedRepo?.name || "",
                });
            }
        };

        fetchUserData();
    }, []);

    const handleRepoSelect = async (repoId) => {
        const selected = userData.repos.find((repo) => repo.id.toString() === repoId.toString());
        await new Promise((resolve) => {
            chrome.storage.sync.set({ selected_repo_id: repoId }, resolve);
        });
        setSelectedRepo({ id: repoId, name: selected?.name || "" });
    };

    const handleToggleSync = async (checked) => {
        if (!checked) {
            await new Promise((resolve) => {
                chrome.storage.sync.remove("selected_repo_id", resolve);
            });
            setSelectedRepo({ id: null, name: "" });
        } else if (userData.repos.length > 0) {
            const firstRepo = userData.repos[0];
            await new Promise((resolve) => {
                chrome.storage.sync.set({ selected_repo_id: firstRepo.id }, resolve);
            });
            setSelectedRepo({ id: firstRepo.id, name: firstRepo.name });
        }
    };

    const handleCreateRepo = async (values) => {
        try {
            setCreatingRepo(true);
            const response = await axios.post(`${API_URL}/user/github/repo`, {
                user_id: userData.userID,
                repo_name: values.repoName,
            });

            const newRepo = { id: response.data.repo_id, name: values.repoName };

            setUserData((prev) => ({
                ...prev,
                repos: [...prev.repos, newRepo],
            }));
            setSelectedRepo(newRepo);
            await new Promise((resolve) => {
                chrome.storage.sync.set({ selected_repo_id: newRepo.id }, resolve);
            });

            form.reset();
            toast({
                title: "Success",
                description: `Created and selected repository: ${values.repoName}`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.status === 400 ? "Repository name already exists" : "Cannot create repository",
                variant: "destructive",
            });
        } finally {
            setCreatingRepo(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-3">
            <div className="space-y-4 flex flex-col w-full max-w-md">
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                            <Avatar>
                                <AvatarImage src={userData.avatarUrl} />
                                <AvatarFallback>{userData.githubName?.[0]}</AvatarFallback>
                            </Avatar>
                            <CardTitle>{userData.githubName}</CardTitle>
                        </div>
                        <div className="flex items-center justify-between pt-3">
                            <p className="text-sm text-muted-foreground">
                                {selectedRepo.id
                                    ? `Currently syncing with: ${selectedRepo.name}`
                                    : "Enable to start syncing with a repository"}
                            </p>
                            <Switch checked={!!selectedRepo.id} onCheckedChange={handleToggleSync} />
                        </div>
                    </CardHeader>

                    {selectedRepo.id && (
                        <CardContent>
                            <Tabs defaultValue="select">
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
                                        <Select
                                            value={selectedRepo.id?.toString()}
                                            onValueChange={handleRepoSelect}
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={selectedRepo.name || "Choose a repository"}
                                                />
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
                                                    <Loader2 className="w-4 animate-spin" />
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
                <SubscriptionCard userID={userData.userID} />
                <ReportIssueButton />
            </div>
        </div>
    );
};

export default App;
