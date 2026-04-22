import { Search } from 'lucide-react'

export default function SearchBar() {
  return (
    <div className="px-4 pt-5">
      <div className="relative flex items-center bg-white rounded-full shadow-md border border-zinc-100">
        <Search
          size={18}
          className="absolute left-4 text-zinc-400 pointer-events-none"
        />
        <input
          type="search"
          readOnly
          placeholder="搜索招聘、房屋、二手、DMV、新闻等"
          className="w-full h-12 pl-11 pr-4 bg-transparent rounded-full text-sm text-zinc-500 placeholder:text-zinc-400 outline-none cursor-pointer focus:ring-2 focus:ring-blue-400 focus:ring-inset"
        />
      </div>
    </div>
  )
}
