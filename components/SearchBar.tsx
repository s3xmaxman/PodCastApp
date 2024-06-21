"use client";
import React, { useState } from "react";
import { Input } from "./ui/input";
import Image from "next/image";

const SearchBar = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="relative mt-8 block">
      <Input className="input-class py-6 pl12 focus-visible:ring-offset-orange-1" />
      <Image
        src="/icons/search.svg"
        alt="search icon"
        width={20}
        height={20}
        className="absolute left-4 top-3.5"
      />
    </div>
  );
};

export default SearchBar;
