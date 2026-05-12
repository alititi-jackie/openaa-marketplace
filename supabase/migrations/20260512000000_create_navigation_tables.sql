begin;

-- navigation_categories table
create table if not exists public.navigation_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  display_limit integer not null default 6,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists navigation_categories_active_sort_idx
  on public.navigation_categories (is_active, sort_order);

-- navigation_links table
create table if not exists public.navigation_links (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.navigation_categories(id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  open_mode text not null default 'auto',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint navigation_links_open_mode_check check (open_mode in ('auto', 'same', 'new'))
);

create index if not exists navigation_links_category_sort_idx
  on public.navigation_links (category_id, is_active, sort_order);

-- Reuse or create set_updated_at trigger function
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end;
$$;

drop trigger if exists trg_navigation_categories_set_updated_at on public.navigation_categories;
create trigger trg_navigation_categories_set_updated_at
before update on public.navigation_categories
for each row
execute function public.set_updated_at();

drop trigger if exists trg_navigation_links_set_updated_at on public.navigation_links;
create trigger trg_navigation_links_set_updated_at
before update on public.navigation_links
for each row
execute function public.set_updated_at();

-- Seed 10 categories
insert into public.navigation_categories (name, slug, sort_order, display_limit, is_active)
select v.name, v.slug, v.sort_order, v.display_limit, true
from (
  values
    ('热门推荐', 'featured',    10, 8),
    ('政府服务', 'government',  20, 6),
    ('银行金融', 'finance',     30, 6),
    ('购物平台', 'shopping',    40, 6),
    ('通讯网络', 'telecom',     50, 6),
    ('AI工具',   'ai',          60, 6),
    ('视频娱乐', 'video',       70, 6),
    ('社交媒体', 'social',      80, 6),
    ('生活服务', 'life',        90, 6),
    ('其它',     'other',      100, 6)
) as v(name, slug, sort_order, display_limit)
where not exists (
  select 1 from public.navigation_categories c where c.slug = v.slug
);

-- Seed initial links from the legacy static data
-- We use a CTE to look up category IDs by slug
with cats as (
  select id, slug from public.navigation_categories
)
insert into public.navigation_links (category_id, title, url, description, open_mode, sort_order, is_active)
select
  c.id,
  v.title,
  v.url,
  v.description,
  v.open_mode,
  v.sort_order,
  true
from (
  values
    -- featured (热门推荐)
    ('featured', 'Google翻译',   'https://translate.google.com/',               '中英文翻译、网页翻译与文档翻译。',    'new',  10),
    ('featured', '168招聘',      '/jobs',                                        'OpenAA 招聘板块入口。',              'same', 20),
    ('featured', '168二手',      '/secondhand',                                  'OpenAA 二手板块入口。',              'same', 30),
    ('featured', '纽约工作网',   'https://newyork.craigslist.org/search/jjj',   '纽约地区招聘信息。',                  'new',  40),
    ('featured', '纽约生活',     'https://newyork.craigslist.org/',              '纽约本地生活信息。',                  'new',  50),
    ('featured', '一亩三分地',   'https://www.1point3acres.com/',                '留学、求职、移民与北美生活社区。',    'new',  60),
    ('featured', 'DMV NY',       'https://dmv.ny.gov/',                          '纽约州 DMV 官方网站。',               'new',  70),
    ('featured', '华人工商黄页', 'https://www.yellowpages.com/',                 '商家查询黄页。',                      'new',  80),

    -- government (政府服务)
    ('government', 'DMV',      'https://www.dmv.org/',      '各州 DMV 导航入口。',         'new', 10),
    ('government', 'USCIS',    'https://www.uscis.gov/',    '移民/工卡/入籍等官方办理入口。', 'new', 20),
    ('government', 'IRS',      'https://www.irs.gov/',      '联邦税务申报与查询。',         'new', 30),
    ('government', 'SSA',      'https://www.ssa.gov/',      '社保号与社保服务。',           'new', 40),
    ('government', 'USA.gov',  'https://www.usa.gov/',      '美国政府服务总入口。',         'new', 50),
    ('government', '美国国务院','https://www.state.gov/',    '国务院信息与领事服务。',       'new', 60),
    ('government', 'CBP',      'https://www.cbp.gov/',      '海关与边境保护。',             'new', 70),
    ('government', 'DOL',      'https://www.dol.gov/',      '劳工部与劳动相关信息。',       'new', 80),

    -- finance (银行金融)
    ('finance', 'Bank of America', 'https://www.bankofamerica.com/', '美国银行官网。',  'new', 10),
    ('finance', 'Chase',           'https://www.chase.com/',          '摩根大通 Chase 官网。', 'new', 20),
    ('finance', 'Wells Fargo',     'https://www.wellsfargo.com/',     '富国银行官网。',  'new', 30),
    ('finance', 'Citi',            'https://www.citi.com/',           '花旗银行官网。',  'new', 40),
    ('finance', 'TD',              'https://www.td.com/us/en/personal-banking', 'TD Bank 官网。', 'new', 50),
    ('finance', 'Capital One',     'https://www.capitalone.com/',     'Capital One 官网。', 'new', 60),
    ('finance', 'PNC',             'https://www.pnc.com/',            'PNC 银行官网。',  'new', 70),
    ('finance', 'Discover',        'https://www.discover.com/',       'Discover 金融服务。', 'new', 80),
    ('finance', 'Amex',            'https://www.americanexpress.com/','American Express 官网。', 'new', 90),

    -- shopping (购物平台)
    ('shopping', 'Amazon',      'https://www.amazon.com/',       'Amazon 电商平台。',    'new', 10),
    ('shopping', 'Walmart',     'https://www.walmart.com/',      'Walmart 超市与电商。', 'new', 20),
    ('shopping', 'eBay',        'https://www.ebay.com/',         'eBay 二手与拍卖平台。','new', 30),
    ('shopping', 'Costco',      'https://www.costco.com/',       'Costco 仓储会员店。',  'new', 40),
    ('shopping', 'Target',      'https://www.target.com/',       'Target 官网。',        'new', 50),
    ('shopping', 'BestBuy',     'https://www.bestbuy.com/',      'BestBuy 电子产品零售。','new', 60),
    ('shopping', 'Weee',        'https://www.sayweee.com/',      'Weee 亚洲食品生鲜配送。','new', 70),
    ('shopping', 'AliExpress',  'https://www.aliexpress.com/',   'AliExpress 海淘平台。','new', 80),

    -- telecom (通讯网络)
    ('telecom', 'T-Mobile',   'https://www.t-mobile.com/',      'T-Mobile 官网。',     'new', 10),
    ('telecom', 'Verizon',    'https://www.verizon.com/',       'Verizon 官网。',      'new', 20),
    ('telecom', 'AT&T',       'https://www.att.com/',           'AT&T 官网。',         'new', 30),
    ('telecom', 'Tello',      'https://tello.com/',             'Tello 虚拟运营商。',  'new', 40),
    ('telecom', 'Mint',       'https://www.mintmobile.com/',    'Mint Mobile 虚拟运营商。','new', 50),
    ('telecom', 'Lycamobile', 'https://www.lycamobile.us/',     'Lycamobile 官网。',   'new', 60),
    ('telecom', 'Cricket',    'https://www.cricketwireless.com/','Cricket Wireless 官网。','new', 70),
    ('telecom', 'Google Fi',  'https://fi.google.com/',         'Google Fi 官网。',    'new', 80),

    -- ai (AI工具)
    ('ai', 'ChatGPT',   'https://chat.openai.com/',           'OpenAI ChatGPT。',  'new', 10),
    ('ai', 'DeepSeek',  'https://www.deepseek.com/',          'DeepSeek。',        'new', 20),
    ('ai', 'Gemini',    'https://gemini.google.com/',         'Google Gemini。',   'new', 30),
    ('ai', 'Claude',    'https://claude.ai/',                 'Anthropic Claude。','new', 40),
    ('ai', 'Copilot',   'https://copilot.microsoft.com/',     'Microsoft Copilot。','new', 50),
    ('ai', 'Grok',      'https://grok.x.ai/',                 'xAI Grok。',        'new', 60),
    ('ai', 'Perplexity','https://www.perplexity.ai/',         'Perplexity 搜索助手。','new', 70),
    ('ai', 'Kimi',      'https://kimi.moonshot.cn/',          'Kimi 智能助手。',   'new', 80),
    ('ai', '豆包',      'https://www.doubao.com/',            '豆包 AI。',         'new', 90),
    ('ai', '通义千问',  'https://tongyi.aliyun.com/qianwen/', '阿里通义千问。',    'new', 100),

    -- video (视频娱乐)
    ('video', 'YouTube',  'https://www.youtube.com/',   'YouTube 视频平台。', 'new', 10),
    ('video', 'Netflix',  'https://www.netflix.com/',   'Netflix 流媒体。',   'new', 20),
    ('video', 'TikTok',   'https://www.tiktok.com/',    'TikTok 短视频。',    'new', 30),
    ('video', 'B站',      'https://www.bilibili.com/',  '哔哩哔哩。',         'new', 40),
    ('video', 'Disney+',  'https://www.disneyplus.com/','Disney+ 流媒体。',   'new', 50),
    ('video', 'Hulu',     'https://www.hulu.com/',      'Hulu 流媒体。',      'new', 60),

    -- social (社交媒体)
    ('social', 'Facebook',   'https://www.facebook.com/',      'Facebook 社交。',   'new', 10),
    ('social', 'Instagram',  'https://www.instagram.com/',     'Instagram 社交。',  'new', 20),
    ('social', '小红书',     'https://www.xiaohongshu.com/',   '小红书社区。',      'new', 30),
    ('social', 'X',          'https://x.com/',                 'X (Twitter)。',     'new', 40),
    ('social', 'Reddit',     'https://www.reddit.com/',        'Reddit 社区。',     'new', 50),
    ('social', 'LinkedIn',   'https://www.linkedin.com/',      'LinkedIn 职场社交。','new', 60),
    ('social', '微信网页版', 'https://web.wechat.com/',        '微信网页版。',      'new', 70),
    ('social', '微博',       'https://weibo.com/',             '微博。',            'new', 80),

    -- life (生活服务)
    ('life', '纽约生活',     'https://newyork.craigslist.org/', '纽约本地生活信息。',    'new', 10),
    ('life', '纽约华人365',  'https://www.365wuyu.com/',        '房屋与生活信息。',      'new', 20),
    ('life', '华人工商黄页', 'https://www.yellowpages.com/',    '商家查询黄页。',        'new', 30),
    ('life', 'Yelp',         'https://www.yelp.com/',           'Yelp 商家点评与搜索。', 'new', 40),
    ('life', 'Groupon',      'https://www.groupon.com/',        'Groupon 优惠与团购。',  'new', 50),
    ('life', 'DoorDash',     'https://www.doordash.com/',       'DoorDash 外卖配送。',   'new', 60),

    -- other (其它)
    ('other', '百度',       'https://www.baidu.com/',     '百度搜索。',        'new', 10),
    ('other', 'Gmail',      'https://mail.google.com/',   'Gmail 邮箱。',      'new', 20),
    ('other', 'Outlook',    'https://outlook.live.com/',  'Outlook 邮箱。',    'new', 30),
    ('other', '知乎',       'https://www.zhihu.com/',     '知乎。',            'new', 40),
    ('other', 'Steam',      'https://store.steampowered.com/', 'Steam 游戏平台。', 'new', 50),
    ('other', '世界日报',   'https://www.worldjournal.com/','世界日报官网。',   'new', 60)
) as v(slug, title, url, description, open_mode, sort_order)
join cats c on c.slug = v.slug
where not exists (
  select 1 from public.navigation_links l
  where l.category_id = c.id and l.url = v.url
);

commit;
