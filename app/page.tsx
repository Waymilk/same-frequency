"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  configureWechatShare,
  isWechatBrowser,
  type WechatShareStatus,
} from "../lib/wechat-client";

type ChannelKey = "chinese" | "western" | "kpop" | "acg";
type Screen = "home" | "channels" | "join" | "quiz" | "mbti" | "profile" | "invite" | "duoResult";
type DimensionKey = "emotion" | "energy" | "mainstream" | "discovery" | "nostalgia" | "live";
type ParticipantRole = "solo" | "host" | "guest";
type RoomStatus = "idle" | "loading" | "waiting" | "completed" | "expired" | "error";
type WechatAssist = {
  mode: "save" | "share";
  posterUrl: string;
  title: string;
  status?: WechatShareStatus | "loading";
};

type Channel = {
  key: ChannelKey;
  short: string;
  name: string;
  code: string;
  tag: string;
  description: string;
  signal: string;
};

type Question = {
  title: string;
  options: string[];
};

type Dimension = {
  key: DimensionKey;
  label: string;
  code: string;
  description: string;
};

type PersonalProfile = {
  scores: Record<DimensionKey, number>;
  title: string;
  summary: string;
  primary: Dimension;
  secondary: Dimension;
  answeredCount: number;
};

type DuoReport = {
  algorithmVersion: string;
  score: number;
  tier: { rank: string; title: string; label: string };
  duoTitle: string;
  choiceScore: number;
  dimensionScore: number;
  dominantScore: number;
  mbtiScore: number | null;
  exactMatches: number;
  comparableAnswers: number;
  exactIndices: number[];
  divergenceIndices: number[];
  resonanceKeys: DimensionKey[];
  dimensionSimilarity: Record<DimensionKey, number>;
  host: {
    answers: Record<string, number>;
    scores: Record<DimensionKey, number>;
    mbti: string | null;
  };
  guest: {
    answers: Record<string, number>;
    scores: Record<DimensionKey, number>;
    mbti: string | null;
  };
};

const channels: Channel[] = [
  {
    key: "chinese",
    short: "华语",
    name: "华语向",
    code: "CHN",
    tag: "霓虹磁带",
    description: "从周杰伦到草东，把你们的中文歌单放进同一个声道。",
    signal: "RED / GOLD",
  },
  {
    key: "western",
    short: "欧美",
    name: "欧美向",
    code: "WEST",
    tag: "电蓝频谱",
    description: "从流行巨星到独立摇滚，校准两个人的欧美播放列表。",
    signal: "BLUE / SILVER",
  },
  {
    key: "kpop",
    short: "KPOP",
    name: "KPOP 向",
    code: "KPOP",
    tag: "粉紫舞台",
    description: "本命、主打歌与舞台风格，看看你们是否站在同一个打歌现场。",
    signal: "PINK / VIOLET",
  },
  {
    key: "acg",
    short: "二次元",
    name: "二次元向",
    code: "ACG",
    tag: "像素次元",
    description: "动画主题曲、Vocaloid 与配乐，扫描你们之间的次元壁。",
    signal: "CYAN / LIME",
  },
];

const dimensions: Dimension[] = [
  { key: "emotion", label: "情绪感受", code: "EMO", description: "你会先听见旋律里的情绪，再记住歌名。" },
  { key: "energy", label: "能量水平", code: "NRG", description: "节奏和推进感，是你判断一首歌是否对味的第一信号。" },
  { key: "mainstream", label: "流行共鸣", code: "POP", description: "你擅长从大众旋律里找到真正经得起循环的部分。" },
  { key: "discovery", label: "探索倾向", code: "EXP", description: "比起熟悉答案，你更容易被陌生声线和新鲜编曲吸引。" },
  { key: "nostalgia", label: "怀旧浓度", code: "RET", description: "你的歌单不只是音乐，也在替记忆保存时间。" },
  { key: "live", label: "现场冲动", code: "LIV", description: "你偏爱能把人拉进同一片声场的音乐。" },
];

const dimensionProfiles: Record<DimensionKey, number[]> = {
  emotion: [94, 32, 42, 52, 68, 36],
  energy: [34, 95, 68, 42, 30, 86],
  mainstream: [48, 70, 94, 28, 58, 72],
  discovery: [58, 50, 26, 95, 32, 58],
  nostalgia: [76, 30, 58, 38, 95, 44],
  live: [42, 88, 60, 64, 34, 96],
};

const optionProfiles: DimensionKey[][] = [
  ["nostalgia", "emotion", "mainstream", "energy", "nostalgia", "discovery"],
  ["emotion", "emotion", "discovery", "mainstream", "discovery", "nostalgia"],
  ["energy", "mainstream", "live", "energy", "nostalgia", "mainstream"],
  ["emotion", "emotion", "emotion", "energy", "nostalgia", "emotion"],
  ["energy", "mainstream", "energy", "live", "nostalgia", "mainstream"],
  ["emotion", "nostalgia", "emotion", "discovery", "emotion", "emotion"],
  ["energy", "energy", "mainstream", "live", "energy", "mainstream"],
  ["emotion", "mainstream", "emotion", "energy", "discovery", "nostalgia"],
  ["mainstream", "live", "energy", "mainstream", "nostalgia", "discovery"],
  ["live", "discovery", "energy", "discovery", "live", "nostalgia"],
  ["nostalgia", "emotion", "discovery", "mainstream", "energy", "mainstream"],
  ["nostalgia", "discovery", "mainstream", "emotion", "discovery", "nostalgia"],
  ["mainstream", "emotion", "live", "discovery", "nostalgia", "energy"],
  ["live", "mainstream", "energy", "live", "discovery", "nostalgia"],
  ["emotion", "discovery", "nostalgia", "energy", "emotion", "discovery"],
  ["mainstream", "emotion", "energy", "discovery", "nostalgia", "live"],
];

const profileTitles: Record<DimensionKey, string> = {
  emotion: "深夜情绪收藏家",
  energy: "高能声场发动机",
  mainstream: "热门旋律捕手",
  discovery: "隐秘声线勘探者",
  nostalgia: "旧日回声保管员",
  live: "现场共振体",
};

const duoDimensionCopy: Record<DimensionKey, string> = {
  emotion: "你们都会先接住歌曲里的情绪，适合交换那些不需要解释太多的深夜单曲。",
  energy: "你们对节拍和推进感的反应接近，歌单很容易从第一首就把气氛点亮。",
  mainstream: "你们都懂好副歌的威力，热门旋律在你们这里不是俗套，而是共同语言。",
  discovery: "你们对陌生声线保持好奇，很适合轮流把私藏音乐推入彼此的播放列表。",
  nostalgia: "你们会用音乐保存时间，相似的旧歌记忆让关系拥有天然的回声。",
  live: "你们都偏爱能把人拉进同一片声场的音乐，最适合一起站进演出现场。",
};

const mbtiAxes = [
  {
    code: "01",
    label: "能量来源",
    options: [
      { letter: "E", title: "外向", hint: "在人群和交流里充电" },
      { letter: "I", title: "内向", hint: "在独处和自己的世界里充电" },
    ],
  },
  {
    code: "02",
    label: "信息偏好",
    options: [
      { letter: "S", title: "实感", hint: "相信具体体验和当下细节" },
      { letter: "N", title: "直觉", hint: "喜欢联想、可能性和隐藏含义" },
    ],
  },
  {
    code: "03",
    label: "判断方式",
    options: [
      { letter: "T", title: "思考", hint: "优先分析逻辑与一致性" },
      { letter: "F", title: "情感", hint: "优先感受价值与人的状态" },
    ],
  },
  {
    code: "04",
    label: "生活方式",
    options: [
      { letter: "J", title: "判断", hint: "偏爱计划、确定和完成感" },
      { letter: "P", title: "感知", hint: "偏爱自由、变化和即兴感" },
    ],
  },
] as const;

const mbtiTitles: Record<string, string> = {
  INTJ: "深空编曲师",
  INTP: "频谱解构者",
  ENTJ: "声场指挥官",
  ENTP: "风格破界者",
  INFJ: "灵魂译码者",
  INFP: "月光收藏家",
  ENFJ: "共鸣召集人",
  ENFP: "霓虹漫游者",
  ISTJ: "经典守序者",
  ISFJ: "温柔留声机",
  ESTJ: "节拍统筹者",
  ESFJ: "合唱气氛组",
  ISTP: "冷调采样师",
  ISFP: "感官造梦者",
  ESTP: "舞池点火者",
  ESFP: "现场闪光体",
};

const mbtiDescriptions: Record<string, string> = {
  INTJ: "你会搭建自己的审美坐标，不轻易被榜单改写。",
  INTP: "你喜欢拆解声音结构，也乐于追踪不寻常的编曲线索。",
  ENTJ: "你天生掌控播放顺序，知道什么时候该把气氛推到最高点。",
  ENTP: "你的歌单拒绝边界，总能从风格碰撞里找到新鲜感。",
  INFJ: "你把音乐当作读懂情绪和他人的隐秘语言。",
  INFP: "你的收藏像私人宇宙，每首歌都对应一段难以替代的感受。",
  ENFJ: "你擅长用一首歌让所有人进入同一个情绪频道。",
  ENFP: "你跟随好奇心切换声场，热烈又保留浪漫的意外。",
  ISTJ: "你尊重经得住时间的作品，也愿意把经典反复听出新细节。",
  ISFJ: "你的歌单温柔而可靠，总能替重要的人和记忆保留位置。",
  ESTJ: "你偏爱清晰、有力、能迅速建立秩序感的声音。",
  ESFJ: "你听歌时也在感受人群，最懂什么旋律能让大家一起唱。",
  ISTP: "你对音色和节奏十分敏锐，偏爱克制但有精密质感的作品。",
  ISFP: "你相信身体和直觉，追随当下真正让自己有感觉的声音。",
  ESTP: "你是现场气氛的点火者，节拍响起就会自然进入状态。",
  ESFP: "你会把音乐变成当下的高光，让每次播放都像一场小型演出。",
};

function calculateProfile(answers: Record<number, number>): PersonalProfile {
  const totals = Object.fromEntries(dimensions.map(({ key }) => [key, 0])) as Record<DimensionKey, number>;
  const validAnswers = Object.entries(answers).filter(([, optionIndex]) => optionIndex >= 0);

  validAnswers.forEach(([questionIndex, optionIndex]) => {
    const profileKey = optionProfiles[Number(questionIndex)]?.[optionIndex] ?? "discovery";
    const weights = dimensionProfiles[profileKey];
    dimensions.forEach(({ key }, dimensionIndex) => {
      totals[key] += weights[dimensionIndex];
    });
  });

  const divisor = validAnswers.length || 1;
  const scores = Object.fromEntries(
    dimensions.map(({ key }) => [key, validAnswers.length ? Math.round(totals[key] / divisor) : 50]),
  ) as Record<DimensionKey, number>;

  const ranked = [...dimensions].sort((a, b) => scores[b.key] - scores[a.key]);
  const [primary, secondary] = ranked;

  return {
    scores,
    title: profileTitles[primary.key],
    summary: `${primary.description} 同时，你的「${secondary.label}」也很突出——这让你的歌单既有稳定的个人底色，又保留了可被别人听见的入口。`,
    primary,
    secondary,
    answeredCount: validAnswers.length,
  };
}

function radarPoints(values: number[], radius = 82, center = 100) {
  return values
    .map((value, index) => {
      const angle = ((index * 60 - 90) * Math.PI) / 180;
      const distance = (value / 100) * radius;
      return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
    })
    .join(" ");
}

const questionSets: Record<ChannelKey, Question[]> = {
  chinese: [
    { title: "六首华语歌只能留下一首", options: ["周杰伦《晴天》", "孙燕姿《遇见》", "陈奕迅《富士山下》", "五月天《温柔》", "张学友《她来听我的演唱会》", "王菲《红豆》"] },
    { title: "凌晨两点，你最可能循环", options: ["毛不易《消愁》", "方大同《特别的人》", "草东没有派对《山海》", "蔡健雅《红色高跟鞋》", "郭顶《水星记》", "张悬《宝贝》"] },
    { title: "自驾出发时播放第一首", options: ["告五人《爱人错过》", "苏打绿《无与伦比的美丽》", "逃跑计划《夜空中最亮的星》", "陶喆《小镇姑娘》", "朴树《平凡之路》", "孙燕姿《第一天》"] },
    { title: "失恋当天只允许听一首", options: ["陈奕迅《十年》", "梁静茹《可惜不是你》", "周杰伦《说好的幸福呢》", "孙燕姿《我怀念的》", "薛之谦《演员》", "张惠妹《我最亲爱的》"] },
    { title: "KTV 开场，你会选择", options: ["五月天《恋爱ING》", "周杰伦《简单爱》", "林俊杰《江南》", "陈奕迅《浮夸》", "王力宏《大城小爱》", "张学友《吻别》"] },
    { title: "一个人走在雨里，你会播放", options: ["孙燕姿《雨天》", "周杰伦《搁浅》", "莫文蔚《阴天》", "房东的猫《云烟成雨》", "陶喆《寂寞的季节》", "林俊杰《她说》"] },
    { title: "需要快速恢复能量时", options: ["GALA《追梦赤子心》", "五月天《倔强》", "逃跑计划《夜空中最亮的星》", "新裤子《你要跳舞吗》", "羽泉《奔跑》", "张杰《逆战》"] },
    { title: "想把一首歌发给喜欢的人", options: ["方大同《特别的人》", "周杰伦《告白气球》", "陈奕迅《陪你度过漫长岁月》", "五月天《私奔到月球》", "陶喆《爱，很简单》", "王菲《我愿意》"] },
    { title: "只能看一场华语演唱会", options: ["周杰伦", "陈奕迅", "五月天", "林俊杰", "张学友", "王力宏"] },
    { title: "音乐节六个舞台同时开演", options: ["草东没有派对", "告五人", "新裤子", "万能青年旅店", "痛仰", "逃跑计划"] },
    { title: "只能保留一位华语女歌手", options: ["孙燕姿", "王菲", "蔡健雅", "梁静茹", "张惠妹", "莫文蔚"] },
    { title: "只能保留一位创作歌手", options: ["陶喆", "方大同", "李荣浩", "毛不易", "周深", "郭顶"] },
    { title: "以后只能听一种华语曲风", options: ["华语流行", "R&B / Soul", "摇滚 / 独立音乐", "民谣", "粤语流行", "电子 / 舞曲"] },
    { title: "你最想站在哪一种现场", options: ["Livehouse 摇滚现场", "大型流行演唱会", "户外音乐节", "小型不插电现场", "爵士酒馆", "交响音乐会"] },
    { title: "工作或学习时适合播放", options: ["华语 Lo-fi", "City Pop", "轻民谣", "完全不能听歌", "古典钢琴", "白噪音 / 环境音"] },
    { title: "只能用一首歌介绍你的音乐审美，你会选？", options: ["周杰伦《简单爱》", "陈奕迅《陪你度过漫长岁月》", "五月天《私奔到月球》", "方大同《特别的人》", "陶喆《爱，很简单》", "王菲《我愿意》"] },
  ],
  western: [
    { title: "六首欧美歌只能留下一首", options: ["Coldplay《Yellow》", "Taylor Swift《Cruel Summer》", "The Weeknd《Blinding Lights》", "Billie Eilish《bad guy》", "Adele《Rolling in the Deep》", "Queen《Bohemian Rhapsody》"] },
    { title: "凌晨两点，你最可能循环", options: ["Lana Del Rey《Summertime Sadness》", "Adele《Someone Like You》", "Lord Huron《The Night We Met》", "The Weeknd《Die For You》", "Billie Eilish《ocean eyes》", "Joji《SLOW DANCING IN THE DARK》"] },
    { title: "自驾出发时播放第一首", options: ["Dua Lipa《Levitating》", "Harry Styles《As It Was》", "WALK THE MOON《Shut Up and Dance》", "Avicii《Wake Me Up》", "Fleetwood Mac《Dreams》", "Bruce Springsteen《Born to Run》"] },
    { title: "失恋当天只允许听一首", options: ["Olivia Rodrigo《drivers license》", "Lewis Capaldi《Someone You Loved》", "Miley Cyrus《Flowers》", "Kelly Clarkson《Since U Been Gone》", "Adele《Easy On Me》", "Taylor Swift《All Too Well》"] },
    { title: "派对开场，你会播放", options: ["Mark Ronson ft. Bruno Mars《Uptown Funk》", "Dua Lipa《Don't Start Now》", "The Black Eyed Peas《I Gotta Feeling》", "The Weeknd《Starboy》", "ABBA《Dancing Queen》", "Lady Gaga《Poker Face》"] },
    { title: "一个人走在雨里，你会播放", options: ["Radiohead《Creep》", "Coldplay《The Scientist》", "Taylor Swift《cardigan》", "Cigarettes After Sex《Apocalypse》", "Bon Iver《Holocene》", "Adele《When We Were Young》"] },
    { title: "需要快速恢复能量时", options: ["Queen《Don't Stop Me Now》", "Kanye West《Stronger》", "David Guetta ft. Sia《Titanium》", "Imagine Dragons《Believer》", "Eminem《Lose Yourself》", "Survivor《Eye of the Tiger》"] },
    { title: "想把一首歌发给喜欢的人", options: ["Coldplay《Yellow》", "Taylor Swift《Lover》", "Bruno Mars《Just the Way You Are》", "Daniel Caesar ft. H.E.R.《Best Part》", "Ed Sheeran《Perfect》", "Harry Styles《Adore You》"] },
    { title: "只能看一场欧美演唱会", options: ["Taylor Swift", "The Weeknd", "Beyoncé", "Bruno Mars", "Adele", "Coldplay"] },
    { title: "音乐节六个舞台同时开演", options: ["Coldplay", "Arctic Monkeys", "Kendrick Lamar", "Calvin Harris", "Billie Eilish", "Tame Impala"] },
    { title: "只能保留一位欧美女歌手", options: ["Adele", "Lana Del Rey", "Billie Eilish", "Dua Lipa", "Beyoncé", "Taylor Swift"] },
    { title: "只能保留一支乐队", options: ["The Beatles", "Queen", "Radiohead", "Coldplay", "Arctic Monkeys", "Nirvana"] },
    { title: "以后只能听一种欧美曲风", options: ["Pop", "R&B / Soul", "Rock / Indie", "Hip-Hop / Rap", "Electronic / Dance", "Folk / Country"] },
    { title: "你最想站在哪一种现场", options: ["体育场流行演唱会", "摇滚音乐节", "地下 Hip-Hop 现场", "电子音乐节", "Jazz Club", "小型不插电现场"] },
    { title: "工作或学习时适合播放", options: ["Lo-fi Hip Hop", "Jazz", "Indie Pop", "完全不能听歌", "Classical / Piano", "Ambient"] },
    { title: "只能用一首歌介绍你的音乐审美，你会选？", options: ["Taylor Swift《Lover》", "Coldplay《Yellow》", "Lady Gaga & Bruno Mars《Die With A Smile》", "Stephen Sanchez《Until I Found You》", "Harry Styles《Adore You》", "Daniel Caesar ft. H.E.R.《Best Part》"] },
  ],
  kpop: [
    { title: "六首代表性主打歌只能留下一首", options: ["Girls' Generation《Gee》", "BIGBANG《FANTASTIC BABY》", "BLACKPINK《DDU-DU DDU-DU》", "BTS《Dynamite》", "EXO《Growl》", "TWICE《TT》"] },
    { title: "凌晨两点，你最可能循环", options: ["IU《Through the Night》", "BTS《Spring Day》", "NewJeans《Ditto》", "LeeHi《BREATHE》", "TAEYEON《11:11》", "DEAN《instagram》"] },
    { title: "出发时播放第一首", options: ["NewJeans《Super Shy》", "IVE《After LIKE》", "(G)I-DLE《Queencard》", "aespa《Supernova》", "LE SSERAFIM《ANTIFRAGILE》", "Stray Kids《MANIAC》"] },
    { title: "情绪低落时只允许听一首", options: ["TAEYANG《EYES, NOSE, LIPS》", "LeeHi《ONLY》", "TAEYEON《Fine》", "iKON《LOVE SCENARIO》", "AKMU《How can I love the heartbreak, you're the one I love》", "BTS《The Truth Untold》"] },
    { title: "聚会开场，你会播放", options: ["BIGBANG《BANG BANG BANG》", "aespa《Next Level》", "LE SSERAFIM《ANTIFRAGILE》", "Stray Kids《God's Menu》", "2NE1《I AM THE BEST》", "PSY《GANGNAM STYLE》"] },
    { title: "一个人走在雨里，你会播放", options: ["TAEYEON《11:11》", "DEAN《instagram》", "HEIZE《You, Clouds, Rain》", "IU《Through the Night》", "BOL4《To My Youth》", "Epik High《Rain Song》"] },
    { title: "需要快速恢复能量时", options: ["SEVENTEEN《VERY NICE》", "ITZY《WANNABE》", "BTS《FIRE》", "IVE《I AM》", "NCT 127《Kick It》", "ATEEZ《BOUNCY》"] },
    { title: "想把一首歌发给喜欢的人", options: ["BOL4《Some》", "AKMU《Love Lee》", "LeeHi《ONLY》", "SEVENTEEN《Darling》", "IU《Blueming》", "Red Velvet《Would U》"] },
    { title: "只能看一场团体演唱会", options: ["BTS", "BLACKPINK", "SEVENTEEN", "TWICE", "EXO", "Stray Kids"] },
    { title: "只能保留一个女团", options: ["Girls' Generation", "BLACKPINK", "aespa", "IVE", "TWICE", "(G)I-DLE"] },
    { title: "只能保留一位 SOLO 歌手", options: ["IU", "TAEYEON", "G-DRAGON", "DEAN", "ZICO", "BIBI"] },
    { title: "只能看一位表演者的个人舞台", options: ["TAEMIN", "j-hope", "LISA", "KAI", "HYUNA", "JUNG KOOK"] },
    { title: "以后只能保留一种 KPOP 风格", options: ["清新 / Y2K", "强烈 Hip-Hop", "梦幻概念", "复古 Disco", "Band / Live Sound", "Ballad / OST"] },
    { title: "你最想站在哪一种现场", options: ["打歌节目录制", "体育场巡演", "拼盘音乐节", "小型 Fan Meeting", "Club DJ Set", "Acoustic Live"] },
    { title: "工作或学习时适合播放", options: ["K-R&B", "抒情 OST", "轻快女团歌单", "完全不能听歌", "Piano Cover", "Instrumental Playlist"] },
    { title: "只能用一首歌介绍你的音乐审美，你会选？", options: ["iKON《LOVE SCENARIO》", "BOL4《Some》", "BTS《Boy With Luv》", "TWICE《What Is Love?》", "IU《Blueming》", "SEVENTEEN《_WORLD》"] },
  ],
  acg: [
    { title: "六首经典主题曲只能留下一首", options: ["高橋洋子《残酷な天使のテーゼ》", "和田光司《Butter-Fly》", "fripSide《only my railgun》", "Linked Horizon《紅蓮の弓矢》", "LiSA《crossing field》", "FLOW《GO!!!》"] },
    { title: "凌晨两点，你最可能循环", options: ["茅原実里《優しい忘却》", "supercell《君の知らない物語》", "TK from 凛として時雨《unravel》", "RADWIMPS《なんでもないや》", "Aimer《Ref:rain》", "EGOIST《Departures》"] },
    { title: "出发时播放第一首", options: ["YUI《again》", "米津玄師《ピースサイン》", "キタニタツヤ《青のすみか》", "米津玄師《KICK BACK》", "SPYAIR《イマジネーション》", "LiSA《紅蓮華》"] },
    { title: "情绪低落时只允许听一首", options: ["Girls Dead Monster《一番の宝物》", "茅野愛衣、戸松遥、早見沙織《secret base》", "奥華子《変わらないもの》", "EGOIST《Departures》", "Aimer《茜さす》", "Lia《鳥の詩》"] },
    { title: "聚会开场，你会播放", options: ["和田光司《Butter-Fly》", "FLOW《GO!!!》", "LiSA《crossing field》", "JAM Project《THE HERO!!》", "ClariS《コネクト》", "KANA-BOON《シルエット》"] },
    { title: "一个人走在雨里，你会播放", options: ["つじあやの《風になる》", "手嶌葵《テルーの唄》", "木村弓《いつも何度でも》", "ヨルシカ《晴る》", "Aimer《Ref:rain》", "RADWIMPS《スパークル》"] },
    { title: "需要快速恢复能量时", options: ["LiSA《紅蓮華》", "Eve《廻廻奇譚》", "YOASOBI《怪物》", "SiM《The Rumbling》", "Linked Horizon《紅蓮の弓矢》", "SawanoHiroyuki[nZk]:mizuki《aLIEz》"] },
    { title: "想把一首歌发给喜欢的人", options: ["supercell《君の知らない物語》", "RADWIMPS《なんでもないや》", "花澤香菜《恋愛サーキュレーション》", "Goose house《光るなら》", "ClariS《コネクト》", "Aimer《カタオモイ》"] },
    { title: "只能看一场歌手现场", options: ["LiSA", "Aimer", "YOASOBI", "RADWIMPS", "ReoNa", "fripSide"] },
    { title: "只能保留一个动画音乐团体", options: ["FLOW", "Linked Horizon", "BUMP OF CHICKEN", "SPYAIR", "MAN WITH A MISSION", "ASIAN KUNG-FU GENERATION"] },
    { title: "只能保留一位 Vocaloid 创作者", options: ["DECO*27", "wowaka", "ryo（supercell）", "ハチ", "kz（livetune）", "ピノキオピー"] },
    { title: "只能保留一位配乐创作者", options: ["久石让", "梶浦由记", "泽野弘之", "川井宪次", "菅野洋子", "田中公平"] },
    { title: "以后只能保留一种二次元音乐类型", options: ["动画摇滚 OP", "J-Pop", "Vocaloid", "OST / 管弦配乐", "音游曲", "动画角色歌"] },
    { title: "你最想站在哪一种现场", options: ["Anisong 大型演唱会", "动画交响音乐会", "Vocaloid 虚拟演唱会", "日系乐队 Livehouse", "动漫展舞台", "游戏音乐会"] },
    { title: "工作或学习时适合播放", options: ["吉卜力钢琴曲", "Anime Lo-fi", "游戏原声", "完全不能听歌", "Vocaloid 钢琴改编", "环境音"] },
    { title: "只能用一首歌介绍你的音乐审美，你会选？", options: ["supercell《君の知らない物語》", "RADWIMPS《なんでもないや》", "secret base ～君がくれたもの～", "花澤香菜《恋愛サーキュレーション》", "Goose house《光るなら》", "ClariS《コネクト》"] },
  ],
};

const Waveform = ({ compact = false }: { compact?: boolean }) => (
  <div className={`waveform ${compact ? "waveform--compact" : ""}`} aria-hidden="true">
    {Array.from({ length: compact ? 20 : 48 }, (_, i) => (
      <i key={i} style={{ "--bar": `${22 + ((i * 37) % 74)}%`, "--delay": `${(i % 8) * -0.12}s` } as React.CSSProperties} />
    ))}
  </div>
);

const posterPalettes: Record<ChannelKey, { accent: string; accent2: string; glow: string }> = {
  chinese: { accent: "#ff3b4f", accent2: "#ffb627", glow: "rgba(255,59,79,.28)" },
  western: { accent: "#2187ff", accent2: "#e6f2ff", glow: "rgba(33,135,255,.28)" },
  kpop: { accent: "#ff3bd5", accent2: "#a861ff", glow: "rgba(255,59,213,.28)" },
  acg: { accent: "#00f0d4", accent2: "#bbff35", glow: "rgba(0,240,212,.28)" },
};

function posterPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

async function loadQrImage(value: string, width: number, errorCorrectionLevel: "M" | "H" = "M") {
  const qrModule = await import("qrcode");
  const source = await qrModule.toDataURL(value, {
    width,
    margin: 2,
    color: { dark: "#050811", light: "#f4f7ff" },
    errorCorrectionLevel,
  });
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("二维码生成失败"));
    image.src = source;
  });
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [channelKey, setChannelKey] = useState<ChannelKey>("chinese");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [mbtiLetters, setMbtiLetters] = useState(["", "", "", ""]);
  const [participantRole, setParticipantRole] = useState<ParticipantRole>("solo");
  const [roomCode, setRoomCode] = useState("");
  const [roomStatus, setRoomStatus] = useState<RoomStatus>("idle");
  const [roomError, setRoomError] = useState("");
  const [roomBusy, setRoomBusy] = useState(false);
  const [duoReport, setDuoReport] = useState<DuoReport | null>(null);
  const [posterUrl, setPosterUrl] = useState("");
  const [posterOpen, setPosterOpen] = useState(false);
  const [posterBusy, setPosterBusy] = useState(false);
  const [invitePosterUrl, setInvitePosterUrl] = useState("");
  const [invitePosterOpen, setInvitePosterOpen] = useState(false);
  const [invitePosterBusy, setInvitePosterBusy] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const [wechatAssist, setWechatAssist] = useState<WechatAssist | null>(null);
  const [answerBusy, setAnswerBusy] = useState(false);
  const [quizNotice, setQuizNotice] = useState("");
  const answerLock = useRef(false);
  const homeChannelsRef = useRef<HTMLDivElement>(null);
  const wechatShareRequest = useRef(0);
  const wechatOriginalUrl = useRef<string | null>(null);

  const channel = channels.find((item) => item.key === channelKey)!;
  const questions = questionSets[channelKey];
  const question = questions[questionIndex];
  const progress = ((questionIndex + 1) / questions.length) * 100;

  const completed = useMemo(() => Object.keys(answers).length, [answers]);
  const profile = useMemo(() => calculateProfile(answers), [answers]);
  const profileValues = dimensions.map(({ key }) => profile.scores[key]);
  const mbti = mbtiLetters.join("");
  const mbtiComplete = mbtiLetters.every(Boolean);
  const mbtiIdentity = mbtiComplete ? mbtiTitles[mbti] : "";
  const honorTitle = mbtiIdentity ? `${mbtiIdentity} · ${profile.title}` : profile.title;
  const signalPower = Math.min(
    99,
    Math.round((profile.scores[profile.primary.key] + profile.scores[profile.secondary.key]) / 2 + profile.answeredCount * 1.8),
  );
  const honorRank = signalPower >= 94 ? "S+" : signalPower >= 86 ? "S" : "A+";
  const inviteUrl = roomCode && typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : "";
  const duoHostValues = dimensions.map(({ key }) => duoReport?.host.scores[key] ?? 50);
  const duoGuestValues = dimensions.map(({ key }) => duoReport?.guest.scores[key] ?? 50);
  const sharedChoices = (duoReport?.exactIndices ?? []).slice(0, 3).map((index) => ({
    question: questions[index]?.title ?? `QUESTION ${index + 1}`,
    answer: questions[index]?.options[duoReport?.host.answers[index] ?? -1] ?? "共同跳过",
  }));
  const divergenceChoices = (duoReport?.divergenceIndices ?? []).map((index) => ({
    question: questions[index]?.title ?? `QUESTION ${index + 1}`,
    host: questions[index]?.options[duoReport?.host.answers[index] ?? -1] ?? "跳过",
    guest: questions[index]?.options[duoReport?.guest.answers[index] ?? -1] ?? "跳过",
  }));
  const duoConclusion = duoReport
    ? duoReport.score >= 88
      ? "你们不是单纯喜欢同一批歌，而是会用相近的方式理解音乐。共同播放列表很容易成为关系里的秘密频道。"
      : duoReport.score >= 72
        ? "你们拥有稳定的共同声场，也保留了足够多的不同。最适合轮流掌控播放权，让熟悉和意外交替出现。"
        : "你们的音乐轨道不总是重合，但差异本身很有探索价值。交换歌单会比寻找标准答案更有意思。"
    : "";

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("room")?.trim().toUpperCase();
    if (!code) return;

    // The URL is an external input; initialize the guest session once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoomCode(code);
    setParticipantRole("guest");
    setRoomStatus("loading");
    fetch(`/api/rooms?code=${encodeURIComponent(code)}`)
      .then(async (response) => {
        const data = await response.json() as {
          room?: { channel: ChannelKey; status: RoomStatus };
          report?: DuoReport | null;
          error?: string;
        };
        if (!response.ok || !data.room) throw new Error(data.error || "房间载入失败");
        setChannelKey(data.room.channel);
        setRoomStatus(data.room.status);
        setDuoReport(data.report ?? null);
        setScreen(data.room.status === "completed" && data.report ? "duoResult" : "join");
      })
      .catch((error: unknown) => {
        setRoomStatus("error");
        setRoomError(error instanceof Error ? error.message : "房间载入失败");
        setScreen("join");
      });
  }, []);

  useEffect(() => {
    if (screen !== "invite" || participantRole !== "host" || roomStatus !== "waiting" || !roomCode) return;

    let cancelled = false;
    let timer = 0;
    let delay = 5000;

    const scheduleNextCheck = () => {
      if (cancelled) return;
      timer = window.setTimeout(checkRoom, delay);
    };

    const checkRoom = async () => {
      if (document.hidden) {
        delay = 15000;
        scheduleNextCheck();
        return;
      }

      try {
        const response = await fetch(`/api/rooms?code=${encodeURIComponent(roomCode)}`, { cache: "no-store" });
        const data = await response.json() as {
          room?: { status: RoomStatus };
          report?: DuoReport | null;
          error?: string;
        };
        if (!response.ok || !data.room) throw new Error(data.error || "同步失败");
        setRoomStatus(data.room.status);
        if (data.report) setDuoReport(data.report);
        if (data.room.status !== "waiting") return;
      } catch {
        // A temporary network interruption should not eject the host from the waiting room.
      }

      delay = Math.min(15000, Math.round(delay * 1.5));
      scheduleNextCheck();
    };

    void checkRoom();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [participantRole, roomCode, roomStatus, screen]);

  const goHome = () => {
    window.history.replaceState({}, "", window.location.pathname);
    setScreen("home");
    setQuestionIndex(0);
    setAnswers({});
    setMbtiLetters(["", "", "", ""]);
    setParticipantRole("solo");
    setRoomCode("");
    setRoomStatus("idle");
    setRoomError("");
    setDuoReport(null);
    setPosterUrl("");
    setPosterOpen(false);
    setInvitePosterUrl("");
    setInvitePosterOpen(false);
    setShareFeedback("");
    setAnswerBusy(false);
    setQuizNotice("");
    answerLock.current = false;
  };

  const chooseChannel = (key: ChannelKey) => {
    setChannelKey(key);
    setQuestionIndex(0);
    setAnswers({});
    setMbtiLetters(["", "", "", ""]);
    setAnswerBusy(false);
    setQuizNotice("");
    answerLock.current = false;
  };

  const startQuiz = () => {
    setQuestionIndex(0);
    setAnswers({});
    setMbtiLetters(["", "", "", ""]);
    setAnswerBusy(false);
    setQuizNotice("");
    answerLock.current = false;
    setScreen("quiz");
  };

  const scrollToHomeChannels = () => {
    homeChannelsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const answer = (optionIndex: number) => {
    if (answerLock.current) return;
    answerLock.current = true;
    setAnswerBusy(true);
    setQuizNotice("");
    setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }));
    window.setTimeout(() => {
      if (questionIndex === questions.length - 1) {
        setScreen("mbti");
      } else {
        setQuestionIndex((current) => current + 1);
      }
      answerLock.current = false;
      setAnswerBusy(false);
    }, 180);
  };

  const skip = () => answer(-1);

  const ensureCompleteAnswers = () => {
    const missing = Array.from({ length: questions.length }, (_, index) => index)
      .filter((index) => !Object.prototype.hasOwnProperty.call(answers, index));
    if (!missing.length) return true;

    const firstMissing = missing[0];
    setQuestionIndex(firstMissing);
    setQuizNotice(
      missing.length === 1
        ? `第 ${firstMissing + 1} 题的选择未保存，请重新选择后继续。`
        : `检测到 ${missing.length} 道题未保存，已返回第 ${firstMissing + 1} 题。`,
    );
    setRoomError("");
    setScreen("quiz");
    return false;
  };

  const createRoom = async () => {
    if (roomBusy) return;
    if (roomCode && participantRole === "host") {
      setScreen("invite");
      return;
    }
    if (!ensureCompleteAnswers()) return;

    setRoomBusy(true);
    setRoomError("");
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channelKey,
          answers,
          scores: profile.scores,
          mbti: mbtiComplete ? mbti : undefined,
        }),
      });
      const data = await response.json() as {
        room?: { code: string; status: RoomStatus };
        error?: string;
      };
      if (!response.ok || !data.room) throw new Error(data.error || "房间创建失败");
      setParticipantRole("host");
      setRoomCode(data.room.code);
      setRoomStatus(data.room.status);
      setInvitePosterUrl("");
      setScreen("invite");
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : "房间创建失败");
    } finally {
      setRoomBusy(false);
    }
  };

  const submitGuest = async () => {
    if (roomBusy || !roomCode) return;
    if (!ensureCompleteAnswers()) return;
    setRoomBusy(true);
    setRoomError("");
    try {
      const response = await fetch("/api/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: roomCode,
          answers,
          scores: profile.scores,
          mbti: mbtiComplete ? mbti : undefined,
        }),
      });
      const data = await response.json() as {
        room?: { status: RoomStatus };
        report?: DuoReport | null;
        error?: string;
      };
      if (!response.ok || !data.room) throw new Error(data.error || "提交失败");
      setRoomStatus(data.room.status);
      setDuoReport(data.report ?? null);
      setScreen("invite");
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : "提交失败");
    } finally {
      setRoomBusy(false);
    }
  };

  const createInvitePoster = async () => {
    if (!inviteUrl || !roomCode) return "";
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1440;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器不支持海报生成");

    const palette = posterPalettes[channelKey];
    const background = context.createLinearGradient(0, 0, 1080, 1440);
    background.addColorStop(0, "#090d17");
    background.addColorStop(.54, "#070b13");
    background.addColorStop(1, "#04070d");
    context.fillStyle = background;
    context.fillRect(0, 0, 1080, 1440);

    context.strokeStyle = "rgba(105,137,179,.1)";
    context.lineWidth = 1;
    for (let x = 0; x <= 1080; x += 60) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 1440);
      context.stroke();
    }
    for (let y = 0; y <= 1440; y += 60) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(1080, y);
      context.stroke();
    }

    const halo = context.createRadialGradient(540, 790, 40, 540, 790, 620);
    halo.addColorStop(0, palette.glow);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = halo;
    context.fillRect(0, 160, 1080, 1140);

    context.strokeStyle = palette.accent;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(42, 176);
    context.lineTo(42, 42);
    context.lineTo(182, 42);
    context.moveTo(898, 42);
    context.lineTo(1038, 42);
    context.lineTo(1038, 176);
    context.moveTo(42, 1264);
    context.lineTo(42, 1398);
    context.lineTo(182, 1398);
    context.moveTo(898, 1398);
    context.lineTo(1038, 1398);
    context.lineTo(1038, 1264);
    context.stroke();

    context.strokeStyle = "rgba(145,174,214,.26)";
    context.lineWidth = 2;
    context.strokeRect(54, 54, 972, 1332);

    context.fillStyle = palette.accent;
    context.fillRect(74, 82, 8, 38);
    context.fillStyle = palette.accent2;
    context.fillRect(90, 70, 8, 62);
    context.fillRect(122, 70, 8, 62);
    context.fillStyle = palette.accent;
    context.fillRect(106, 82, 8, 38);
    context.fillRect(138, 88, 8, 26);
    context.fillStyle = "#f4f7ff";
    context.font = "800 25px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText("SAME FREQUENCY", 172, 108);
    context.textAlign = "right";
    context.fillStyle = "#68758b";
    context.font = "700 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText("SIGNAL ONLINE", 990, 106);
    context.textAlign = "left";

    context.fillStyle = "#f4f7ff";
    context.font = "900 82px PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText("有人在等你", 74, 250);
    context.fillStyle = palette.accent2;
    context.fillText("进入同一声道", 74, 342);

    context.fillStyle = palette.accent;
    context.fillRect(74, 390, 46, 3);
    context.font = "750 23px PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText(`${channel.short}频道  ·  ${channel.code}`, 142, 400);

    const qrSize = 544;
    const qrX = (1080 - qrSize) / 2;
    const qrY = 476;
    context.fillStyle = "#f4f7ff";
    context.fillRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
    context.save();
    context.shadowColor = palette.accent;
    context.shadowBlur = 36;
    context.strokeStyle = palette.accent;
    context.lineWidth = 3;
    context.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
    context.restore();

    const qrImage = await loadQrImage(inviteUrl, qrSize, "H");
    context.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    context.fillStyle = "#727e91";
    context.font = "700 14px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText("ROOM CODE", 74, 1164);
    context.fillStyle = "#f7f8fb";
    context.font = "850 54px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText(roomCode, 74, 1226);
    context.textAlign = "right";
    context.fillStyle = "#727e91";
    context.font = "700 14px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText("VALID FOR", 990, 1164);
    context.fillStyle = palette.accent2;
    context.font = "800 30px PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText("24 小时", 990, 1218);

    context.strokeStyle = "rgba(145,174,214,.2)";
    context.beginPath();
    context.moveTo(74, 1292);
    context.lineTo(990, 1292);
    context.stroke();
    context.textAlign = "center";
    context.fillStyle = "#8d99aa";
    context.font = "650 18px PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText(`${channel.short}频道 · ${questions.length} 道题 · 24 小时有效`, 540, 1344);
    context.textAlign = "left";

    return canvas.toDataURL("image/png");
  };

  const openInvitePoster = async () => {
    setInvitePosterOpen(true);
    if (invitePosterUrl || invitePosterBusy) return;
    setInvitePosterBusy(true);
    setShareFeedback("");
    try {
      setInvitePosterUrl(await createInvitePoster());
    } catch (error) {
      setShareFeedback(error instanceof Error ? error.message : "邀请海报生成失败，请稍后重试");
    } finally {
      setInvitePosterBusy(false);
    }
  };

  const closeWechatAssist = () => {
    wechatShareRequest.current += 1;
    if (wechatOriginalUrl.current !== null) {
      window.history.replaceState(window.history.state, "", wechatOriginalUrl.current);
      wechatOriginalUrl.current = null;
    }
    setWechatAssist(null);
  };

  const bindWechatShareToRoom = () => {
    if (!inviteUrl) return;
    if (wechatOriginalUrl.current === null) {
      wechatOriginalUrl.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    }
    window.history.replaceState(window.history.state, "", inviteUrl);
  };

  const downloadInvitePoster = () => {
    if (!invitePosterUrl) return;
    if (isWechatBrowser()) {
      wechatShareRequest.current += 1;
      setWechatAssist({ mode: "save", posterUrl: invitePosterUrl, title: "保存房间邀请海报" });
      return;
    }
    const link = document.createElement("a");
    link.href = invitePosterUrl;
    link.download = `同频播放-邀请房间-${roomCode}.png`;
    link.click();
    setShareFeedback("邀请海报已开始保存");
  };

  const shareInvitePoster = async () => {
    if (!invitePosterUrl) return;
    if (isWechatBrowser()) {
      const requestId = ++wechatShareRequest.current;
      const title = `同频播放｜加入我的 ${channel.name} 双人测试`;
      bindWechatShareToRoom();
      setWechatAssist({ mode: "share", posterUrl: invitePosterUrl, title, status: "loading" });
      const status = await configureWechatShare({
        title,
        desc: "16 道音乐选择，看看我们能不能共用一副耳机。",
        link: inviteUrl,
        imgUrl: `${window.location.origin}/share-cover.png`,
      });
      if (requestId !== wechatShareRequest.current) return;
      setWechatAssist({ mode: "share", posterUrl: invitePosterUrl, title, status });
      setShareFeedback(status === "ready" ? "微信好友分享卡片已准备好" : "请使用微信右上角菜单发送给朋友");
      return;
    }
    try {
      const blob = await (await fetch(invitePosterUrl)).blob();
      const file = new File([blob], `同频播放-邀请房间-${roomCode}.png`, { type: "image/png" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: `同频播放｜加入我的 ${channel.name} 双人测试`,
          text: "长按识别海报二维码，进入我的音乐合拍房间。",
          files: [file],
        });
        setShareFeedback("邀请海报分享面板已调起");
        return;
      }
      downloadInvitePoster();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      downloadInvitePoster();
    }
  };

  const startNewDuo = () => {
    window.history.replaceState({}, "", window.location.pathname);
    setQuestionIndex(0);
    setAnswers({});
    setMbtiLetters(["", "", "", ""]);
    setParticipantRole("solo");
    setRoomCode("");
    setRoomStatus("idle");
    setRoomError("");
    setDuoReport(null);
    setPosterUrl("");
    setPosterOpen(false);
    setInvitePosterUrl("");
    setInvitePosterOpen(false);
    setWechatAssist(null);
    setShareFeedback("");
    setAnswerBusy(false);
    setQuizNotice("");
    answerLock.current = false;
    setScreen("channels");
  };

  const resultShareText = duoReport
    ? `我和朋友在「同频播放」拿到了 ${duoReport.score}% 合拍度：${duoReport.tier.title} · ${duoReport.duoTitle}。来看看我们的共同歌单，也测测你和朋友有多同频。`
    : "";

  const createPoster = async () => {
    if (!duoReport || !inviteUrl) return "";
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1440;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器不支持海报生成");

    const palette = posterPalettes[channelKey];
    const gradient = context.createLinearGradient(0, 0, 1080, 1440);
    gradient.addColorStop(0, "#040812");
    gradient.addColorStop(.55, "#07101d");
    gradient.addColorStop(1, "#03060c");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1080, 1440);

    context.strokeStyle = "rgba(93,126,166,.12)";
    context.lineWidth = 1;
    for (let x = 40; x < 1080; x += 40) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 1440);
      context.stroke();
    }
    for (let y = 40; y < 1440; y += 40) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(1080, y);
      context.stroke();
    }

    const halo = context.createRadialGradient(760, 330, 30, 760, 330, 450);
    halo.addColorStop(0, palette.glow);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = halo;
    context.fillRect(0, 0, 1080, 800);

    context.fillStyle = palette.accent;
    context.fillRect(58, 58, 8, 54);
    context.fillStyle = palette.accent2;
    context.fillRect(72, 58, 8, 34);
    context.fillRect(86, 58, 8, 54);
    context.fillStyle = "#f4f7ff";
    context.font = "800 27px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText("SAME FREQUENCY", 116, 91);
    context.fillStyle = "#74829a";
    context.font = "600 15px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.textAlign = "right";
    context.fillText(`${channel.code} CHANNEL  /  ROOM ${roomCode}`, 1022, 88);
    context.textAlign = "left";

    context.strokeStyle = "rgba(145,174,214,.26)";
    context.beginPath();
    context.moveTo(58, 137);
    context.lineTo(1022, 137);
    context.stroke();

    context.fillStyle = palette.accent;
    context.font = "700 18px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText("DUAL LISTENER HONOR REPORT", 60, 202);
    context.fillStyle = "#f4f7ff";
    context.font = "900 92px PingFang SC, Microsoft YaHei, sans-serif";
    let titleSize = 92;
    while (context.measureText(duoReport.tier.title).width > 540 && titleSize > 52) {
      titleSize -= 4;
      context.font = `900 ${titleSize}px PingFang SC, Microsoft YaHei, sans-serif`;
    }
    context.fillText(duoReport.tier.title, 58, 310);
    context.fillStyle = palette.accent2;
    context.font = "750 39px PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText(duoReport.duoTitle, 61, 376);

    context.save();
    context.shadowColor = palette.accent;
    context.shadowBlur = 35;
    context.strokeStyle = palette.accent2;
    context.lineWidth = 9;
    context.beginPath();
    context.arc(836, 304, 132, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (duoReport.score / 100));
    context.stroke();
    context.restore();
    context.strokeStyle = "rgba(150,178,216,.2)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(836, 304, 132, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#f4f7ff";
    context.textAlign = "center";
    context.font = "900 110px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText(String(duoReport.score), 836, 328);
    context.fillStyle = palette.accent2;
    context.font = "700 26px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText("% MATCH", 836, 370);
    context.textAlign = "left";

    posterPath(context, 58, 448, 964, 280, 12);
    context.fillStyle = "rgba(7,15,27,.88)";
    context.fill();
    context.strokeStyle = "rgba(150,178,216,.25)";
    context.stroke();

    const metrics = [
      ["SONG SYNC", String(duoReport.choiceScore), "歌曲选择"],
      ["PROFILE", String(duoReport.dimensionScore), "六维接近"],
      ["SIGNAL", String(duoReport.dominantScore), "主导声场"],
      ["EXACT", `${duoReport.exactMatches}/${duoReport.comparableAnswers}`, "完全同选"],
    ];
    context.strokeStyle = "rgba(150,178,216,.18)";
    context.beginPath();
    context.moveTo(540, 448);
    context.lineTo(540, 728);
    context.moveTo(58, 588);
    context.lineTo(1022, 588);
    context.stroke();

    metrics.forEach(([code, value, label], index) => {
      const x = index % 2 === 0 ? 86 : 568;
      const y = index < 2 ? 0 : 140;
      context.fillStyle = "#6f7d94";
      context.font = "650 14px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.fillText(code, x, 485 + y);
      context.fillStyle = index === 3 ? palette.accent2 : palette.accent;
      context.font = "850 54px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.fillText(value, x, 545 + y);
      context.fillStyle = "#aab5c7";
      context.font = "500 19px PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText(label, x, 574 + y);
    });

    context.fillStyle = "#6f7d94";
    context.font = "650 15px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText("TOP SHARED SIGNALS", 60, 782);
    duoReport.resonanceKeys.slice(0, 3).forEach((key, index) => {
      const dimension = dimensions.find((item) => item.key === key)!;
      const y = 836 + index * 88;
      context.fillStyle = index === 0 ? palette.accent : "rgba(12,23,39,.94)";
      posterPath(context, 60, y - 42, 620, 68, 8);
      context.fill();
      context.strokeStyle = index === 0 ? palette.accent : "rgba(150,178,216,.2)";
      context.stroke();
      context.fillStyle = index === 0 ? "#fff" : "#c8d1df";
      context.font = "700 25px PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText(`${String(index + 1).padStart(2, "0")}  ${dimension.label}`, 86, y);
      context.textAlign = "right";
      context.fillStyle = palette.accent2;
      context.font = "800 25px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.fillText(`${duoReport.dimensionSimilarity[key]}%`, 650, y);
      context.textAlign = "left";
    });

    const qrImage = await loadQrImage(inviteUrl, 244);
    context.drawImage(qrImage, 758, 790, 244, 244);
    context.fillStyle = "#f4f7ff";
    context.font = "700 20px PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText("扫码查看完整合拍报告", 760, 1070);
    context.fillStyle = "#738198";
    context.font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText(`ROOM ${roomCode}  ·  24H SIGNAL`, 760, 1102);

    context.strokeStyle = "rgba(150,178,216,.24)";
    context.beginPath();
    context.moveTo(58, 1122);
    context.lineTo(1022, 1122);
    context.stroke();
    context.fillStyle = "#f4f7ff";
    context.font = "800 42px PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText("你们的歌单，能共用一副耳机吗？", 58, 1202);
    context.fillStyle = "#9da9bc";
    context.font = "500 24px PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText("把结果发给下一位朋友，再开一条双人声道。", 60, 1253);

    context.fillStyle = palette.accent;
    context.fillRect(58, 1320, 160, 4);
    context.fillStyle = "#68758b";
    context.font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText("16 SONG CHOICES · 6 SIGNAL AXES · 1 PRIVATE CHANNEL", 58, 1362);
    context.textAlign = "right";
    context.fillText("SAME FREQUENCY / 2026", 1022, 1362);

    return canvas.toDataURL("image/png");
  };

  const openPoster = async () => {
    setPosterOpen(true);
    if (posterUrl || posterBusy) return;
    setPosterBusy(true);
    setShareFeedback("");
    try {
      setPosterUrl(await createPoster());
    } catch (error) {
      setShareFeedback(error instanceof Error ? error.message : "海报生成失败，请稍后重试");
    } finally {
      setPosterBusy(false);
    }
  };

  const downloadPoster = () => {
    if (!posterUrl) return;
    if (isWechatBrowser()) {
      wechatShareRequest.current += 1;
      setWechatAssist({ mode: "save", posterUrl, title: "保存双人结果海报" });
      return;
    }
    const link = document.createElement("a");
    link.href = posterUrl;
    link.download = `同频播放-${roomCode}-${duoReport?.score ?? 0}.png`;
    link.click();
    setShareFeedback("海报已开始保存");
  };

  const sharePoster = async () => {
    if (!posterUrl || !duoReport) return;
    if (isWechatBrowser()) {
      const requestId = ++wechatShareRequest.current;
      const title = `同频播放｜${duoReport.score}% ${duoReport.tier.title}`;
      bindWechatShareToRoom();
      setWechatAssist({ mode: "share", posterUrl, title, status: "loading" });
      const status = await configureWechatShare({
        title,
        desc: resultShareText,
        link: inviteUrl,
        imgUrl: `${window.location.origin}/share-cover.png`,
      });
      if (requestId !== wechatShareRequest.current) return;
      setWechatAssist({ mode: "share", posterUrl, title, status });
      setShareFeedback(status === "ready" ? "微信好友分享卡片已准备好" : "请使用微信右上角菜单发送给朋友");
      return;
    }
    try {
      const blob = await (await fetch(posterUrl)).blob();
      const file = new File([blob], `同频播放-${roomCode}.png`, { type: "image/png" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: `同频播放｜${duoReport.score}% ${duoReport.tier.title}`,
          text: resultShareText,
          files: [file],
        });
        setShareFeedback("海报分享面板已调起");
        return;
      }
      downloadPoster();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      downloadPoster();
    }
  };

  const openDuoResult = async () => {
    if (duoReport) {
      setScreen("duoResult");
      return;
    }
    setRoomBusy(true);
    setRoomError("");
    try {
      const response = await fetch(`/api/rooms?code=${encodeURIComponent(roomCode)}`, { cache: "no-store" });
      const data = await response.json() as { report?: DuoReport | null; error?: string };
      if (!response.ok || !data.report) throw new Error(data.error || "双人报告尚未生成");
      setDuoReport(data.report);
      setScreen("duoResult");
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : "双人报告载入失败");
    } finally {
      setRoomBusy(false);
    }
  };

  return (
    <main className={`app theme-${channelKey}`} data-screen={screen}>
      <div className="noise" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />
      <header className="topbar">
        <button className="brand" onClick={goHome} aria-label="返回同频播放首页">
          <span className="brand-mark"><i /><i /><i /><i /><i /></span>
          <span>SAME FREQUENCY</span>
        </button>
        <div className="topbar__right">
          <span className="system-status"><i /> SYSTEM ONLINE</span>
          <span className="topbar__time">SYNC / 16Q</span>
        </div>
      </header>

      {screen === "home" && (
        <section className="home shell">
          <div className="home__copy">
            <p className="eyebrow">DUAL LISTENER COMPATIBILITY TEST</p>
            <h1>同频<br />播放</h1>
            <p className="home__en">SAME FREQUENCY</p>
            <div className="micro-wave"><Waveform compact /></div>
            <p className="lede">两个人，十六次选择，<br className="mobile-hide" />看看你们能不能共用一副耳机。</p>
            <div className="actions home-actions--desktop">
              <button className="button button--primary" onClick={() => setScreen("channels")}>
                发起合拍测试 <span>↗</span>
              </button>
              <button className="button button--ghost" onClick={() => setScreen("channels")}>
                查看四个频道 <span>›</span>
              </button>
            </div>
            <div className="actions home-actions--mobile">
              <button className="button button--primary" onClick={startQuiz}>
                发起合拍测试 <span>↗</span>
              </button>
              <button className="button button--ghost" onClick={scrollToHomeChannels}>
                查看四个频道 <span>›</span>
              </button>
            </div>
            <div className="home__stats">
              <span><b>16</b> QUESTIONS</span>
              <span><b>04</b> CHANNELS</span>
              <span><b>02</b> LISTENERS</span>
            </div>
            <div className="home__telemetry" aria-hidden="true">
              <span>SYNC_FEED.001<i /><i /><i /><i /></span>
              <span>SIGNAL LINK<b>≫</b><i /><i /><i /></span>
            </div>
          </div>

          <div className="home__signal-bridge" aria-hidden="true"><i /><i /><i /></div>

          <div className="signal-console">
            <div className="console-head">
              <span>LIVE SIGNAL / {channel.code}</span>
              <span>128.00 BPM</span>
            </div>
            <div className="channel-track channel-track--left">
              <span className="channel-letter">L</span>
              <Waveform />
            </div>
            <div className="merge-zone">
              <div className="merge-line merge-line--a" />
              <div className="merge-line merge-line--b" />
              <div className="compatibility">
                <small>COMPATIBILITY</small>
                <strong>87<sup>%</sup></strong>
                <div className="meter"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
              </div>
            </div>
            <div className="channel-track channel-track--right">
              <span className="channel-letter">R</span>
              <Waveform />
            </div>
            <div className="console-tabs" ref={homeChannelsRef}>
              {channels.map((item) => (
                <button
                  key={item.key}
                  className={item.key === channelKey ? "is-active" : ""}
                  onClick={() => chooseChannel(item.key)}
                  aria-pressed={item.key === channelKey}
                >
                  <span className="console-tab__desktop"><i /> {item.short}</span>
                  <span className="console-tab__mobile">
                    <Waveform compact />
                    <strong>{item.short}</strong>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {screen === "channels" && (
        <section className="channels-page shell page-shell">
          <div className="page-heading">
            <button className="back" onClick={() => setScreen("home")}>← BACK</button>
            <p className="eyebrow">SELECT FREQUENCY RANGE</p>
            <h2>选择你们的<br />音乐频道</h2>
            <p>频道由发起人锁定，对方将回答完全相同的 16 道题。</p>
          </div>
          <div className="channel-grid">
            {channels.map((item, index) => (
              <button
                key={item.key}
                className={`channel-card channel-card--${item.key} ${channelKey === item.key ? "is-selected" : ""}`}
                onClick={() => chooseChannel(item.key)}
              >
                <div className="channel-card__index">0{index + 1}</div>
                <div className="channel-card__visual">
                  <span>{item.code}</span>
                  <Waveform compact />
                </div>
                <div className="channel-card__copy">
                  <span className="channel-card__tag">{item.tag}</span>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="channel-card__foot">
                  <span>{item.signal}</span>
                  <span>SELECT ↗</span>
                </div>
              </button>
            ))}
          </div>
          <div className="channel-confirm">
            <div><span>SELECTED CHANNEL</span><strong>{channel.code} / {channel.name}</strong></div>
            <button className="button button--primary" onClick={startQuiz}>进入测试 <span>↗</span></button>
          </div>
        </section>
      )}

      {screen === "join" && (
        <section className="join-page shell page-shell">
          <div className="join-panel">
            <div className="join-panel__top">
              <span>INCOMING DUAL SIGNAL</span>
              <span>ROOM / {roomCode || "------"}</span>
            </div>
            {roomStatus === "loading" ? (
              <div className="join-state">
                <div className="waiting-orbit" aria-hidden="true"><i /><i /><i /></div>
                <p className="eyebrow">CONNECTING TO ROOM</p>
                <h2>正在接入<br />对方的声道</h2>
              </div>
            ) : roomStatus === "error" || roomStatus === "expired" ? (
              <div className="join-state">
                <div className="join-alert">!</div>
                <p className="eyebrow">SIGNAL LOST</p>
                <h2>房间信号<br />已经失效</h2>
                <p>{roomError || "这个双人房已超过 24 小时有效期，请让发起人重新生成邀请链接。"}</p>
                <button className="button button--ghost" onClick={goHome}>返回首页 <span>↻</span></button>
              </div>
            ) : roomStatus === "completed" ? (
              <div className="join-state">
                <div className="join-alert is-complete">✓</div>
                <p className="eyebrow">ROOM ALREADY SYNCHRONIZED</p>
                <h2>这个房间<br />已经完成合拍</h2>
                <p>双人声道已经锁定，无法再加入第三位听众。</p>
                <button className="button button--ghost" onClick={goHome}>发起新的合拍 <span>↗</span></button>
              </div>
            ) : (
              <div className="join-grid">
                <div className="join-copy">
                  <p className="eyebrow">LISTENER 01 IS WAITING</p>
                  <h2>有人邀请你<br />进入同一声道</h2>
                  <p>发起人已经完成测试。你将进入锁定的 <strong>{channel.name}</strong>，回答完全相同的 16 道音乐题。</p>
                  <div className="join-room-meta">
                    <span><small>ROOM CODE</small><b>{roomCode}</b></span>
                    <span><small>CHANNEL LOCKED</small><b>{channel.code}</b></span>
                    <span><small>VALID FOR</small><b>24H</b></span>
                  </div>
                  <button className="button button--primary" onClick={startQuiz}>
                    接入声道并开始答题 <span>↗</span>
                  </button>
                </div>
                <div className="join-signal">
                  <span className="channel-letter">L</span>
                  <Waveform />
                  <div className="join-link"><i /><i /><i /><i /><i /></div>
                  <Waveform />
                  <span className="channel-letter">R</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {screen === "quiz" && (
        <section className="quiz-page shell page-shell">
          <div className="quiz-meta">
            <button className="back" onClick={() => setScreen(participantRole === "guest" ? "join" : "channels")}>← EXIT TEST</button>
            <div className="quiz-meta__channel"><i /> {channel.code} CHANNEL LOCKED</div>
            <div>{String(completed).padStart(2, "0")} SAVED</div>
          </div>

          <div className="quiz-progress">
            <div><span>QUESTION</span><strong>{String(questionIndex + 1).padStart(2, "0")} <em>/ 16</em></strong></div>
            <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
            <span>{Math.round(progress)}% SYNCED</span>
          </div>

          <div className="quiz-layout">
            <aside className="quiz-signal">
              <span className="channel-letter">{participantRole === "guest" ? "R" : "L"}</span>
              <Waveform />
              <p>{participantRole === "guest" ? "LISTENER 02" : "LISTENER 01"}</p>
              <strong>CALIBRATING</strong>
            </aside>
            <div className="question-panel">
              <p className="eyebrow">INPUT YOUR SIGNAL</p>
              {quizNotice && <p className="quiz-notice" role="alert">{quizNotice}</p>}
              <h2>{question.title}</h2>
              <div className="answer-grid">
                {question.options.map((option, index) => (
                  <button
                    key={option}
                    className={answers[questionIndex] === index ? "is-selected" : ""}
                    disabled={answerBusy}
                    onClick={() => answer(index)}
                  >
                    <span>0{index + 1}</span>
                    <strong>{option}</strong>
                    <i>↗</i>
                  </button>
                ))}
              </div>
              <button className="skip" disabled={answerBusy} onClick={skip}>这些我都不熟悉，本题不计分 →</button>
            </div>
          </div>
        </section>
      )}

      {screen === "mbti" && (
        <section className="mbti-page shell page-shell">
          <div className="profile-head">
            <button className="back" onClick={() => setScreen("quiz")}>← LAST QUESTION</button>
            <div className="profile-head__status"><i /> OPTIONAL IDENTITY CALIBRATION</div>
            <div>STEP 17 / OPTIONAL</div>
          </div>

          <div className="mbti-layout">
            <div className="mbti-copy">
              <p className="eyebrow">FINAL IDENTITY INPUT</p>
              <h2>最后一道<br />身份校准</h2>
              <p>填写 MBTI，让音乐声纹称号更像你。这个信息只用于生成本次个人侧写，也可以直接跳过。</p>
              <div className={`mbti-code ${mbtiComplete ? "is-complete" : ""}`}>
                {mbtiLetters.map((letter, index) => (
                  <span key={mbtiAxes[index].code}>{letter || "·"}</span>
                ))}
                <small>{mbtiComplete ? mbtiIdentity : "WAITING FOR SIGNAL"}</small>
              </div>
            </div>

            <div className="mbti-panel">
              <div className="mbti-panel__top">
                <span>MBTI / OPTIONAL</span>
                <span>{mbtiComplete ? "IDENTITY LOCKED" : `${mbtiLetters.filter(Boolean).length} / 4 SELECTED`}</span>
              </div>
              <div className="mbti-axes">
                {mbtiAxes.map((axis, axisIndex) => (
                  <div className="mbti-axis" key={axis.code}>
                    <div className="mbti-axis__label">
                      <span>{axis.code}</span>
                      <strong>{axis.label}</strong>
                    </div>
                    <div className="mbti-options">
                      {axis.options.map((option) => (
                        <button
                          key={option.letter}
                          className={mbtiLetters[axisIndex] === option.letter ? "is-selected" : ""}
                          onClick={() => setMbtiLetters((current) => current.map((letter, index) => (
                            index === axisIndex ? option.letter : letter
                          )))}
                          aria-pressed={mbtiLetters[axisIndex] === option.letter}
                        >
                          <b>{option.letter}</b>
                          <span><strong>{option.title}</strong><small>{option.hint}</small></span>
                          <i>{mbtiLetters[axisIndex] === option.letter ? "●" : "○"}</i>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mbti-actions">
                <button
                  className="button button--primary"
                  disabled={!mbtiComplete}
                  onClick={() => setScreen("profile")}
                >
                  解锁专属荣誉称号 <span>↗</span>
                </button>
                <button className="mbti-skip" onClick={() => {
                  setMbtiLetters(["", "", "", ""]);
                  setScreen("profile");
                }}>
                  暂不填写，直接生成音乐称号 →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {screen === "profile" && (
        <section className="profile-page shell page-shell">
          <div className="profile-head">
            <button className="back" onClick={() => setScreen("mbti")}>← IDENTITY INPUT</button>
            <div className="profile-head__status"><i /> HONOR TITLE UNLOCKED</div>
            <div>{profile.answeredCount} / 16 VALID · {participantRole === "guest" ? "LISTENER 02" : "LISTENER 01"}</div>
          </div>

          <div className="profile-layout">
            <div className="profile-hero">
              <div className="honor-kicker">
                <span className="honor-rank">{honorRank}</span>
                <div>
                  <p className="eyebrow">{participantRole === "guest" ? "LISTENER 02" : "LISTENER 01"} / {channel.code}</p>
                  <span className="profile-index">PERSONAL SIGNAL HONOR</span>
                </div>
              </div>
              <div className="honor-title">
                <span>称号已解锁 / TITLE UNLOCKED</span>
                <h2>{honorTitle}</h2>
                <div className="honor-id">
                  <b>{mbtiComplete ? mbti : "SOLO"}</b>
                  <span>{channel.code}-{profile.primary.code}-{String(signalPower).padStart(2, "0")}</span>
                </div>
              </div>
            </div>

            <div className="profile-details">
              <p className="profile-summary">
                {mbtiComplete ? `${mbtiDescriptions[mbti]} ` : ""}
                {profile.summary}
              </p>

              <div className="trait-pair">
                <div>
                  <span>PRIMARY SIGNAL</span>
                  <strong>{profile.primary.label}</strong>
                  <b>{profile.scores[profile.primary.key]}</b>
                </div>
                <div>
                  <span>SECONDARY SIGNAL</span>
                  <strong>{profile.secondary.label}</strong>
                  <b>{profile.scores[profile.secondary.key]}</b>
                </div>
              </div>

              <div className="actions">
                <button
                  className="button button--primary"
                  disabled={roomBusy}
                  onClick={participantRole === "guest" ? submitGuest : createRoom}
                >
                  {roomBusy
                    ? "正在同步声道…"
                    : participantRole === "guest"
                      ? "提交结果并完成合拍"
                      : "创建双人房并邀请"} <span>↗</span>
                </button>
                <button className="button button--ghost" onClick={() => setScreen(participantRole === "guest" ? "join" : "channels")}>
                  {participantRole === "guest" ? "返回邀请房间" : "换个频道再测"} <span>↻</span>
                </button>
              </div>
              {roomError && <p className="room-error" role="alert">{roomError}</p>}
            </div>

            <div className="profile-console">
              <div className="profile-console__top">
                <span>PERSONAL FREQUENCY MAP</span>
                <span>{channel.code} / 16Q</span>
              </div>

              <div className="radar-wrap">
                <svg className="profile-radar" viewBox="0 0 200 200" role="img" aria-label="六维音乐人格雷达图">
                  {[25, 50, 75, 100].map((ring) => (
                    <polygon
                      key={ring}
                      className="radar-ring"
                      points={radarPoints(Array(6).fill(ring))}
                    />
                  ))}
                  {dimensions.map((dimension, index) => {
                    const angle = ((index * 60 - 90) * Math.PI) / 180;
                    return (
                      <line
                        key={dimension.key}
                        className="radar-axis"
                        x1="100"
                        y1="100"
                        x2={100 + Math.cos(angle) * 82}
                        y2={100 + Math.sin(angle) * 82}
                      />
                    );
                  })}
                  <polygon className="radar-value" points={radarPoints(profileValues)} />
                  {profileValues.map((value, index) => {
                    const angle = ((index * 60 - 90) * Math.PI) / 180;
                    const distance = (value / 100) * 82;
                    return (
                      <circle
                        key={dimensions[index].key}
                        className="radar-dot"
                        cx={100 + Math.cos(angle) * distance}
                        cy={100 + Math.sin(angle) * distance}
                        r="2.8"
                      />
                    );
                  })}
                </svg>
                <div className="radar-label radar-label--emotion">情绪</div>
                <div className="radar-label radar-label--energy">能量</div>
                <div className="radar-label radar-label--mainstream">流行</div>
                <div className="radar-label radar-label--discovery">探索</div>
                <div className="radar-label radar-label--nostalgia">怀旧</div>
                <div className="radar-label radar-label--live">现场</div>
              </div>

              <div className="dimension-list">
                {dimensions.map((dimension) => (
                  <div key={dimension.key} className="dimension-row">
                    <span>{dimension.code}</span>
                    <strong>{dimension.label}</strong>
                    <div><i style={{ width: `${profile.scores[dimension.key]}%` }} /></div>
                    <b>{profile.scores[dimension.key]}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {screen === "invite" && (
        <section className="invite-page shell page-shell">
          <button className="back" onClick={() => setScreen("profile")}>← PERSONAL PROFILE</button>
          <div className="invite-grid">
            <div className="invite-copy">
              <p className="eyebrow">
                {roomStatus === "completed" ? "DUAL SIGNAL SYNCHRONIZED" : "LISTENER 01 CALIBRATED"}
              </p>
              <div className="success-code">{roomStatus === "completed" ? "02 / 02" : "01 / 02"}</div>
              <h2>
                {roomStatus === "completed"
                  ? <>双声道<br />连接成功</>
                  : participantRole === "guest"
                    ? <>你的答案<br />已经送达</>
                    : <>正在等待<br />另一位听众</>}
              </h2>
              <p>
                {roomStatus === "completed"
                  ? <>房间 <strong>{roomCode}</strong> 已完成双人同步。下一阶段将从两份答案中生成你们的合拍报告。</>
                  : participantRole === "guest"
                    ? <>房间 <strong>{roomCode}</strong> 已收到你的答案，发起人的等待页会自动变为完成状态。</>
                    : <>邀请对方进入 <strong>{channel.name}</strong>。页面会持续监听房间状态，对方提交后自动完成连接。</>}
              </p>
              {participantRole === "host" && roomStatus === "waiting" && (
                <div className="actions">
                  <button className="button button--primary" onClick={openInvitePoster}>
                    分享房间 <span>▣</span>
                  </button>
                </div>
              )}
              {roomStatus === "completed" && (
                <div className="actions">
                  <button className="button button--primary" disabled={roomBusy} onClick={openDuoResult}>
                    {roomBusy ? "正在生成合拍报告…" : "查看完整合拍报告"} <span>↗</span>
                  </button>
                </div>
              )}
              {roomError && <p className="room-error" role="alert">{roomError}</p>}
              <button className="restart-link" onClick={goHome}>发起新的双人测试</button>
            </div>

            <div className={`invite-card ${roomStatus === "completed" ? "is-complete" : ""}`}>
              <div className="invite-card__top">
                <span>SAME FREQUENCY</span>
                <span>{channel.code} / ROOM {roomCode}</span>
              </div>
              <div className="invite-card__signal">
                <span className="channel-letter">L</span>
                <Waveform />
                <div className="waiting-node">{roomStatus === "completed" ? "✓" : "?"}</div>
                <Waveform />
                <span className={`channel-letter ${roomStatus === "completed" ? "" : "muted"}`}>R</span>
              </div>
              <div className="invite-card__content">
                <span className="channel-card__tag">{channel.tag}</span>
                <h3>
                  {roomStatus === "completed"
                    ? <>DUAL SIGNAL<br />SYNC COMPLETE</>
                    : <>WAITING FOR<br />LISTENER 02</>}
                </h3>
                <p>本次频道：{channel.name}<br />房间有效期 24 小时 · 状态自动刷新</p>
              </div>
              <div className="invite-code">
                <span>ROOM CODE</span>
                <strong>{roomCode}</strong>
                <small>{roomStatus === "completed" ? "BOTH LISTENERS ONLINE" : "WAITING / AUTO REFRESH"}</small>
              </div>
            </div>
          </div>
        </section>
      )}

      {screen === "duoResult" && duoReport && (
        <section className="duo-page shell page-shell">
          <div className="profile-head duo-head">
            <button className="back" onClick={() => setScreen("invite")}>← DUAL ROOM</button>
            <div className="profile-head__status"><i /> DUAL REPORT UNLOCKED</div>
            <div>ROOM {roomCode} · ALGORITHM V{duoReport.algorithmVersion}</div>
          </div>

          <div className="duo-hero">
            <div className="duo-score" style={{ "--duo-score": `${duoReport.score * 3.6}deg` } as React.CSSProperties}>
              <div>
                <span>COMPATIBILITY</span>
                <strong>{duoReport.score}<sup>%</sup></strong>
                <small>{duoReport.tier.label}</small>
              </div>
            </div>
            <div className="duo-hero__copy">
              <div className="duo-rank-line">
                <span className="honor-rank">{duoReport.tier.rank}</span>
                <div><p className="eyebrow">DUAL LISTENER HONOR TITLE</p><small>{channel.code} / {channel.name}</small></div>
              </div>
              <h1>{duoReport.tier.title}</h1>
              <h2>{duoReport.duoTitle}</h2>
              <p>{duoConclusion}</p>
              <div className="duo-identities">
                <span><b>L</b>{duoReport.host.mbti || "SOLO ID"}</span>
                <i>×</i>
                <span><b>R</b>{duoReport.guest.mbti || "SOLO ID"}</span>
              </div>
            </div>
          </div>

          <div className="duo-metrics">
            <div><span>SONG CHOICE SYNC</span><strong>{duoReport.choiceScore}</strong><small>具体歌曲选择</small></div>
            <div><span>PROFILE DISTANCE</span><strong>{duoReport.dimensionScore}</strong><small>六维人格接近度</small></div>
            <div><span>DOMINANT SIGNAL</span><strong>{duoReport.dominantScore}</strong><small>主导声场重合度</small></div>
            <div><span>EXACT MATCHES</span><strong>{duoReport.exactMatches}<sup>/{duoReport.comparableAnswers}</sup></strong><small>完全相同答案</small></div>
          </div>

          <div className="duo-analysis">
            <div className="duo-radar-panel">
              <div className="duo-section-head">
                <div><span>01</span><h3>双人声纹叠图</h3></div>
                <div className="duo-legend"><span><i /> LISTENER L</span><span><i /> LISTENER R</span></div>
              </div>
              <div className="duo-radar-wrap">
                <svg className="profile-radar" viewBox="0 0 200 200" role="img" aria-label="双人六维音乐人格对比雷达图">
                  {[25, 50, 75, 100].map((ring) => (
                    <polygon key={ring} className="radar-ring" points={radarPoints(Array(6).fill(ring))} />
                  ))}
                  {dimensions.map((dimension, index) => {
                    const angle = ((index * 60 - 90) * Math.PI) / 180;
                    return (
                      <line
                        key={dimension.key}
                        className="radar-axis"
                        x1="100"
                        y1="100"
                        x2={100 + Math.cos(angle) * 82}
                        y2={100 + Math.sin(angle) * 82}
                      />
                    );
                  })}
                  <polygon className="duo-radar-host" points={radarPoints(duoHostValues)} />
                  <polygon className="duo-radar-guest" points={radarPoints(duoGuestValues)} />
                </svg>
                <div className="radar-label radar-label--emotion">情绪</div>
                <div className="radar-label radar-label--energy">能量</div>
                <div className="radar-label radar-label--mainstream">流行</div>
                <div className="radar-label radar-label--discovery">探索</div>
                <div className="radar-label radar-label--nostalgia">怀旧</div>
                <div className="radar-label radar-label--live">现场</div>
              </div>
              <div className="duo-dimensions">
                {dimensions.map((dimension) => (
                  <div key={dimension.key}>
                    <span>{dimension.code}</span>
                    <strong>{dimension.label}</strong>
                    <div>
                      <i style={{ width: `${duoReport.host.scores[dimension.key]}%` }} />
                      <b style={{ width: `${duoReport.guest.scores[dimension.key]}%` }} />
                    </div>
                    <em>{duoReport.dimensionSimilarity[dimension.key]}%</em>
                  </div>
                ))}
              </div>
            </div>

            <div className="duo-resonance-panel">
              <div className="duo-section-head">
                <div><span>02</span><h3>核心共振点</h3></div>
                <small>TOP SHARED SIGNALS</small>
              </div>
              <div className="resonance-list">
                {duoReport.resonanceKeys.map((key, index) => {
                  const dimension = dimensions.find((item) => item.key === key)!;
                  return (
                    <div key={key}>
                      <span>0{index + 1}</span>
                      <div><strong>{dimension.label}</strong><p>{duoDimensionCopy[key]}</p></div>
                      <b>{duoReport.dimensionSimilarity[key]}%</b>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="duo-choices">
            <div className="choice-report">
              <div className="duo-section-head">
                <div><span>03</span><h3>你们选了同一首</h3></div>
                <small>{duoReport.exactMatches} EXACT MATCHES</small>
              </div>
              <div className="shared-choice-list">
                {sharedChoices.length ? sharedChoices.map((item, index) => (
                  <div key={`${item.question}-${index}`}>
                    <span>Q{String(duoReport.exactIndices[index] + 1).padStart(2, "0")}</span>
                    <div><small>{item.question}</small><strong>{item.answer}</strong></div>
                    <b>SYNC</b>
                  </div>
                )) : <p className="empty-signal">没有完全相同的答案，但你们的六维声场仍然可能互补。</p>}
              </div>
            </div>

            <div className="choice-report">
              <div className="duo-section-head">
                <div><span>04</span><h3>最有趣的不同</h3></div>
                <small>SURPRISE DIVERGENCE</small>
              </div>
              <div className="divergence-list">
                {divergenceChoices.length ? divergenceChoices.map((item, index) => (
                  <div key={`${item.question}-${index}`}>
                    <p>{item.question}</p>
                    <span><b>L</b>{item.host}</span>
                    <i>≠</i>
                    <span><b>R</b>{item.guest}</span>
                  </div>
                )) : <p className="empty-signal">你们在所有可比较题目里都选择了相同答案。</p>}
              </div>
            </div>
          </div>

          <div className="duo-final">
            <div>
              <p className="eyebrow">YOUR PRIVATE DUAL CHANNEL</p>
              <h2>把这份同频<br />留在你们的播放列表里</h2>
            </div>
            <div className="actions">
              <button className="button button--primary" onClick={openPoster}>
                生成分享海报 <span>▣</span>
              </button>
              <button className="button button--ghost" onClick={startNewDuo}>换个人再测 <span>↻</span></button>
            </div>
          </div>
        </section>
      )}

      {invitePosterOpen && participantRole === "host" && roomCode && (
        <div className="invite-share-modal" role="dialog" aria-modal="true" aria-labelledby="invite-poster-title" onClick={() => setInvitePosterOpen(false)}>
          <div className="invite-share-sheet" onClick={(event) => event.stopPropagation()}>
            <header className="invite-share-head">
              <h2 id="invite-poster-title"><i aria-hidden="true" />邀请好友加入同频</h2>
              <button className="invite-share-close" onClick={() => setInvitePosterOpen(false)} aria-label="关闭邀请海报">×</button>
            </header>
            <div className="invite-share-body">
              <div className="invite-share-preview">
                {invitePosterBusy && (
                  <div className="poster-loading">
                    <span />
                    <strong>正在编码房间二维码</strong>
                    <small>GENERATING 1080 × 1440 INVITE POSTER</small>
                  </div>
                )}
                {!invitePosterBusy && invitePosterUrl && (
                  <img src={invitePosterUrl} alt={`${channel.name}房间${roomCode}邀请二维码海报`} />
                )}
                {!invitePosterBusy && !invitePosterUrl && <p className="room-error">{shareFeedback || "邀请海报暂时无法生成"}</p>}
              </div>
              <p className="invite-share-summary"><i aria-hidden="true" />{channel.short}频道 · {questions.length} 道题 · 24 小时有效</p>
              <div className="invite-share-actions">
                <button className="invite-share-button invite-share-button--primary" disabled={!invitePosterUrl || invitePosterBusy} onClick={shareInvitePoster}>
                  分享邀请海报 <span>↗</span>
                </button>
                <button className="invite-share-button invite-share-button--secondary" disabled={!invitePosterUrl || invitePosterBusy} onClick={downloadInvitePoster}>
                  保存图片
                </button>
              </div>
              <p className="invite-share-hint" role={shareFeedback ? "status" : undefined}>
                {shareFeedback || "微信内可直接分享，或保存图片后发送"}
              </p>
            </div>
          </div>
        </div>
      )}

      {posterOpen && duoReport && (
        <div className="invite-share-modal result-share-modal" role="dialog" aria-modal="true" aria-labelledby="poster-title" onClick={() => setPosterOpen(false)}>
          <div className="invite-share-sheet result-share-sheet" onClick={(event) => event.stopPropagation()}>
            <header className="invite-share-head">
              <h2 id="poster-title"><i aria-hidden="true" />分享双人合拍报告</h2>
              <button className="invite-share-close" onClick={() => setPosterOpen(false)} aria-label="关闭分享海报">×</button>
            </header>
            <div className="invite-share-body">
              <div className="invite-share-preview result-share-preview">
                {posterBusy && (
                  <div className="poster-loading">
                    <span />
                    <strong>正在编码双人声场</strong>
                    <small>GENERATING 1080 × 1440 POSTER</small>
                  </div>
                )}
                {!posterBusy && posterUrl && <img src={posterUrl} alt={`${duoReport.score}% ${duoReport.tier.title}双人合拍结果海报`} />}
                {!posterBusy && !posterUrl && <p className="room-error">{shareFeedback || "海报暂时无法生成"}</p>}
              </div>
              <p className="invite-share-summary result-share-summary"><i aria-hidden="true" />{duoReport.score}% · {duoReport.tier.title} · {channel.short}频道</p>
              <div className="invite-share-actions">
                <button className="invite-share-button invite-share-button--primary" disabled={!posterUrl || posterBusy} onClick={sharePoster}>
                  分享结果海报 <span>↗</span>
                </button>
                <button className="invite-share-button invite-share-button--secondary" disabled={!posterUrl || posterBusy} onClick={downloadPoster}>
                  保存图片
                </button>
              </div>
              <p className="invite-share-hint" role={shareFeedback ? "status" : undefined}>
                {shareFeedback || "微信内可长按保存，或使用分享按钮发送"}
              </p>
            </div>
          </div>
        </div>
      )}

      {wechatAssist && (
        <div className={`wechat-assist wechat-assist--${wechatAssist.mode}`} role="dialog" aria-modal="true" aria-labelledby="wechat-assist-title">
          <header className="wechat-assist__head">
            <div>
              <p>{wechatAssist.mode === "save" ? "LONG PRESS TO SAVE" : "WECHAT SHARE"}</p>
              <h2 id="wechat-assist-title">{wechatAssist.title}</h2>
            </div>
            <button onClick={closeWechatAssist} aria-label="关闭微信分享引导">×</button>
          </header>
          {wechatAssist.mode === "share" && <div className="wechat-assist__arrow" aria-hidden="true">↗</div>}
          <div className="wechat-assist__poster">
            {/* A native image element is required for WeChat's long-press save menu. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={wechatAssist.posterUrl} alt={wechatAssist.title} />
          </div>
          <div className="wechat-assist__message">
            {wechatAssist.mode === "save" ? (
              <>
                <strong>长按海报，选择“保存图片”</strong>
                <span>保存后可在微信聊天中作为图片发送</span>
              </>
            ) : (
              <>
                <strong>点击右上角，选择“发送给朋友”</strong>
                <span>
                  {wechatAssist.status === "loading"
                    ? "正在准备好友分享卡片…"
                    : wechatAssist.status === "ready"
                      ? "分享卡片已准备好"
                      : "当前房间链接已绑定；发送海报图片请先长按保存"}
                </span>
              </>
            )}
          </div>
          <button className="wechat-assist__done" onClick={closeWechatAssist}>完成</button>
        </div>
      )}

      <footer className="footer">
        <span>© 2026 SAME FREQUENCY</span>
        <span>DUAL CHANNEL MUSIC TEST</span>
        <span className="footer-signal"><i /> SIGNAL STABLE</span>
      </footer>
    </main>
  );
}
