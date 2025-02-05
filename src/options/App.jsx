import { useState, useEffect } from "react";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Settings2, FolderGit2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthComponent } from "@/components/github-auth";

const FEEDBACK_FORM = "https://forms.gle/p2Qv8c7uJSgpK6zB7";
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
    const [githubUserID, setGitHubUserID] = useState(null);
    const [repos, setRepos] = useState([]);
    const [selectedRepoID, setSelectedRepoID] = useState(null);
    const [selectedRepoName, setSelectedRepoName] = useState("");
    const [loading, setLoading] = useState(true);
    const [creatingRepo, setCreatingRepo] = useState(false);

    const form = useForm({
        resolver: zodResolver(repoFormSchema),
        defaultValues: { repoName: "" },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const stored = await chrome.storage.sync.get(["selected_repo_id", "github_user_id"]);

                if (stored.github_user_id) {
                    const { data } = await axios.get(`${API_URL}/user/repos`, {
                        params: { github_id: stored.github_user_id },
                    });

                    setRepos(data?.repos);
                    setGitHubUserID(stored.github_user_id);

                    const storedRepoId = stored.selected_repo_id;
                    if (storedRepoId) {
                        setSelectedRepoID(storedRepoId);
                        const selectedRepo = data?.repos.find(
                            (repo) => repo.id.toString() === storedRepoId.toString(),
                        );
                        setSelectedRepoName(selectedRepo?.name || "");
                    }
                }
            } catch (error) {
                console.error(error);
                toast({
                    title: "An error occurred",
                    description: "Cannot fetch repositories",
                    action: (
                        <ToastAction
                            altText="Report Issue"
                            onClick={() => window.open(FEEDBACK_FORM, "_blank", "noopener,noreferrer")}
                        >
                            Report Issue
                        </ToastAction>
                    ),
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    const handleRepoSelect = async (repoId) => {
        const selectedRepo = repos.find((repo) => repo.id.toString() === repoId.toString());
        await chrome.storage.sync.set({ selected_repo_id: repoId });
        setSelectedRepoID(repoId);
        setSelectedRepoName(selectedRepo?.name || "");
    };

    const handleToggleSync = async (checked) => {
        if (!checked) {
            await chrome.storage.sync.remove("selected_repo_id");
            setSelectedRepoID(null);
            setSelectedRepoName("");
        } else if (repos.length > 0) {
            const firstRepo = repos[0];
            await chrome.storage.sync.set({ selected_repo_id: firstRepo.id });
            setSelectedRepoID(firstRepo.id);
            setSelectedRepoName(firstRepo.name);
        }
    };

    const handleCreateRepo = async (values) => {
        try {
            setCreatingRepo(true);
            const response = await axios.post(
                `${API_URL}/user/create_repo`,
                {
                    github_id: githubUserID,
                    repo_name: values.repoName,
                },
                {
                    headers: { "Content-Type": "application/json" },
                },
            );

            const newRepoId = response.data.repo_id;
            await chrome.storage.sync.set({ selected_repo_id: newRepoId });

            setSelectedRepoID(newRepoId);
            setSelectedRepoName(values.repoName);
            setRepos([...repos, { id: newRepoId, name: values.repoName }]);

            form.reset();
            toast({
                title: "Success",
                description: `Created and selected repository: ${values.repoName}`,
            });
        } catch (error) {
            if (error.status === 400) {
                toast({
                    title: "Error",
                    description: "Repository name already exists",
                    variant: "destructive",
                });
            } else {
                console.error(error);
                toast({
                    title: "An error occurred",
                    description: "Cannot create repository",
                    action: (
                        <ToastAction
                            altText="Report Issue"
                            onClick={() => window.open(FEEDBACK_FORM, "_blank", "noopener,noreferrer")}
                        >
                            Report Issue
                        </ToastAction>
                    ),
                });
            }
        } finally {
            setCreatingRepo(false);
        }
    };

    const content = (
        <div className="min-h-screen flex items-center justify-center">
            {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FolderGit2 className="w-5 h-5" />
                                <CardTitle>LeetCode to GitHub</CardTitle>
                            </div>
                            <Badge variant={selectedRepoID ? "default" : "secondary"}>
                                {selectedRepoID ? "Active" : "Disabled"}
                            </Badge>
                        </div>
                        <CardDescription className="pb-2">
                            {selectedRepoName
                                ? `Currently syncing to: ${selectedRepoName}`
                                : "Select a repository to start syncing"}
                        </CardDescription>
                        <Separator />
                        <div className="pt-2 flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium">Sync Status</h4>
                                <p className="text-sm text-muted-foreground">
                                    Enable or disable automatic syncing
                                </p>
                            </div>
                            <Switch checked={!!selectedRepoID} onCheckedChange={handleToggleSync} />
                        </div>
                    </CardHeader>

                    {selectedRepoID && (
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
                                    <Select value={selectedRepoID?.toString()} onValueChange={handleRepoSelect}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={selectedRepoName || "Choose a repository"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {repos.map(({ id, name }) => (
                                                <SelectItem key={id} value={id.toString()}>
                                                    {name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                            <Button type="submit" disabled={creatingRepo} className="w-full">
                                                {creatingRepo ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Plus className="mr-2 h-4 w-4" />
                                                )}
                                                Create Repository
                                            </Button>
                                        </form>
                                    </Form>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    )}
                </Card>
            )}
        </div>
    );

    return <AuthComponent>{content}</AuthComponent>;
};

export default App;
