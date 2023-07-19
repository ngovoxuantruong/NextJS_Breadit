"use client";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";

interface pageProps {
    params: {
        slug: string;
    };
}

const page = async ({ params }: pageProps) => {
    const subreddit = await db.subreddit.findFirst({
        where: {
            name: params.slug,
        },
    });
    if (!subreddit) return notFound();

    return <div ></div>;
};

export default page;
