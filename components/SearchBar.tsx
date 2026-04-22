import { Search } from 'lucide-react'

export default function SearchBar() {
  return (
    <div className="px-4 pt-3">
      <div className="relative flex items-center">
        <Search
          size={16}
          className="absolute left-4 text-zinc-400 pointer-events-none"
        />
        <input
          type="search"
          readOnly
          placeholder="搜索招聘、房屋、二手、DMV、新闻等"
          className="w-full h-11 pl-10 pr-4 bg-zinc-50 border border-zinc-100 rounded-full text-sm text-zinc-500 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition cursor-pointer shadow-sm"
        />
      </div>
    </div>
  )
}
