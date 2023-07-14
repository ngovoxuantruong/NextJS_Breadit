import { getAuthSession } from "@/lib/auth";

interface PageProps {
    params: {
        slug: string;
    };
}

const page = async ({ params }: PageProps) => {
    const session = await getAuthSession();

    return <div>page</div>;
};

export default page;
