'use client';

import React, { useState, useEffect, useRef } from 'react';

interface User {
  id: string;
  full_name: string | null;
}

interface UserSearchProps {
  onUserSelect: (user: User) => void;
  placeholder?: string;
  className?: string;
}

export default function UserSearch({ onUserSelect, placeholder = "Search users...", className = "" }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search users when query changes
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.data?.users || []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleUserClick = (user: User) => {
    onUserSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const displayText = (user: User) => {
    return user.full_name || `User ${user.id.slice(0, 8)}...`;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
        {loading && (
          <div className="absolute right-2 top-2.5">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="text-left w-full px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">
                  {displayText(user)}
                </span>
                <span className="text-xs text-gray-500">
                  {user.id}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="px-4 py-2 text-gray-500">
            No users found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}