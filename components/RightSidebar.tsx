"use client";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";

const RightSidebar = () => {
  const { user } = useUser();
  return (
    <section className="right_sidebar text-white-1">
      <SignedIn>
        <Link href={`/user/${user?.id}`} className="flex gap-3 pb-12">
          <UserButton />
          <div className="flex w-full items-center justify-between">
            <h1 className="text-16 truncate font-semibold text-white-1">
              {user?.firstName} {user?.lastName}
            </h1>
          </div>
        </Link>
      </SignedIn>
    </section>
  );
};

export default RightSidebar;
