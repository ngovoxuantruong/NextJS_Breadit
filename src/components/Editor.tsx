"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useForm } from "react-hook-form";
import { PostCreationRequest, PostValidator } from "@/lib/validators/post";
import { zodResolver } from "@hookform/resolvers/zod";
import EditorJS from "@editorjs/editorjs";
import { uploadFiles } from "@/lib/uploadthing";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

interface EditorProps {
    subredditId: string;
}

const Editor: FC<EditorProps> = ({ subredditId }) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PostCreationRequest>({
        resolver: zodResolver(PostValidator),
        defaultValues: {
            subredditId,
            title: "",
            content: null,
        },
    });

    const ref = useRef<EditorJS>();
    const _titleRef = useRef<HTMLTextAreaElement>(null);
    const [isMounted, setIsMounted] = useState<boolean>(false);
    const pathname = usePathname();
    const router = useRouter();

    const initializeEditor = useCallback(async () => {
        const { default: EditorJS } = await import("@editorjs/editorjs");
        const { default: Header } = await import("@editorjs/header");
        const { default: Embed } = await import("@editorjs/embed");
        const { default: Table } = await import("@editorjs/table");
        const { default: List } = await import("@editorjs/list");
        const { default: Code } = await import("@editorjs/code");
        const { default: LinkTool } = await import("@editorjs/link");
        const { default: InlineCode } = await import("@editorjs/inline-code");
        const { default: ImageTool } = await import("@editorjs/image");

        if (!ref.current) {
            const editor = new EditorJS({
                holder: "editor",
                onReady: () => {
                    ref.current = editor;
                },
                placeholder: "Type here to write your post...",
                inlineToolbar: true,
                data: { blocks: [] },
                tools: {
                    header: Header,
                    linkTool: {
                        class: LinkTool,
                        config: {
                            endpoint: "api/link", // backend endpoint for url data fetching,
                        },
                    },
                    image: {
                        class: ImageTool,
                        config: {
                            uploader: {
                                async uploadByFile(file: File) {
                                    const [res] = await uploadFiles([file], "imageUploader");

                                    return {
                                        success: 1,
                                        file: {
                                            url: res.fileUrl,
                                        },
                                    };
                                },
                            },
                        },
                    },
                    list: List,
                    code: Code,
                    inlineCode: InlineCode,
                    table: Table,
                    embed: Embed,
                },
            });
        }
    }, []);

    useEffect(() => {
        if (typeof window !== undefined) {
            setIsMounted(true);
        }
    }, []);

    useEffect(() => {
        if (Object.keys(errors).length) {
            for (const [_keys, value] of Object.entries(errors)) {
                toast({
                    title: "Something went wrong",
                    description: (value as { message: string }).message,
                    variant: "destructive",
                });
            }
        }
    }, [errors]);

    useEffect(() => {
        const init = async () => {
            await initializeEditor();

            setTimeout(() => {
                // set focus to title
                _titleRef.current?.focus();
            }, 0);
        };

        if (isMounted) {
            init();

            return () => {
                ref.current?.destroy();
                ref.current = undefined;
            };
        }
    }, [isMounted, initializeEditor]);

    const { mutate: createPost } = useMutation({
        mutationFn: async ({ title, content, subredditId }: PostCreationRequest) => {
            const payload: PostCreationRequest = {
                title,
                content,
                subredditId,
            };

            const { data } = await axios.post("/api/subreddit/post/create", payload);
            return data;
        },
        onError: () => {
            toast({
                title: "Something went wrong",
                description: "Your post was not published, please try again later",
                variant: "destructive",
            });
        },
        onSuccess: () => {
            // r/mycommunity/submit into r/mycommunity
            const newPath = pathname.split("/").slice(0, -1).join("/");

            router.push(newPath);
            router.refresh();

            return toast({
                description: "Your post was successfully created",
            });
        },
    });

    async function onSubmit(data: PostCreationRequest) {
        const blocks = await ref.current?.save();

        const payload: PostCreationRequest = {
            title: data.title,
            content: blocks,
            subredditId,
        };

        createPost(payload);
    }

    if (!isMounted) {
        return null;
    }

    const { ref: titleRef, ...rest } = register("title");

    return (
        <div className="w-full p-4 bg-zinc-50 rounded-lg border border-zinc-200">
            <form id="subreddit-post-form" className="w-fit" onSubmit={handleSubmit(onSubmit)}>
                <div className="prose prose-stone dark:prose-invert">
                    <TextareaAutosize
                        ref={(e) => {
                            titleRef(e);

                            // @ts-ignore
                            _titleRef.current = e;
                        }}
                        {...rest}
                        placeholder="Title"
                        className="w-full resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none"
                    />

                    <div id="editor" />
                </div>
            </form>
        </div>
    );
};

export default Editor;
