"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HistorySearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function HistorySearchBar({
  onSearch,
  placeholder = "Search history...",
}: HistorySearchBarProps) {
  const [query, setQuery] = useState("");

  // Debounced search execution
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch(""); // Trigger search with empty string to reset
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="pl-10 pr-8 rounded-full bg-secondary/50 border-white/10 focus:border-white/20"
      />
      {query.length > 0 && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-2 flex items-center px-2 text-muted-foreground hover:text-white"
        >
          <Search className="h-4 w-4" /> {/* Using X would be better but keeping consistent for now */}
        </button>
      )}
    </div>
  );
}