import { VoteType } from "@prisma/client";
import { FC } from "react";

interface PostVoteClientProps {
    postId: string;
    initialVotesAmount: number;
    initialVote?: VoteType | null;
}

const PostVoteClient: FC<PostVoteClientProps> = ({ postId, initialVotesAmount, initialVote }) => {
    return <div></div>;
};

export default PostVoteClient;
