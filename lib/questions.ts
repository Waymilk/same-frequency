export type ChannelKey = "chinese" | "western" | "kpop" | "acg";
export type DimensionKey = "emotion" | "energy" | "mainstream" | "discovery" | "nostalgia" | "live";
export type QuestionCategory = "song" | "mood" | "artist" | "genre" | "live" | "habit";

export type Question = {
  id: string;
  title: string;
  options: string[];
  category: QuestionCategory;
  profileKeys: DimensionKey[];
};

type RawQuestion = Omit<Question, "id" | "category" | "profileKeys">;

export const QUESTION_COUNT = 16;
export const BANK_SIZE = 36;

export const questionCategories: QuestionCategory[] = ["song", "mood", "artist", "genre", "live", "habit"];

const categoryByIndex: QuestionCategory[] = [
  "song", "mood", "habit", "mood", "live", "mood", "habit", "mood",
  "live", "live", "artist", "artist", "genre", "live", "habit", "song",
  "song", "song", "song", "song", "mood", "mood", "artist", "artist",
  "artist", "artist", "genre", "genre", "genre", "genre", "genre", "live",
  "live", "habit", "habit", "habit",
];

const profilePatterns: DimensionKey[][] = [
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

const rawQuestionBanks: Record<ChannelKey, RawQuestion[]> = {
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
    { title: "城市夜景亮起时，你会选哪首", options: ["林宥嘉《浪费》", "郭顶《凄美地》", "王菲《暧昧》", "陶喆《普通朋友》", "苏打绿《小情歌》", "落日飞车《My Jinji》"] },
    { title: "春天第一天适合播放", options: ["孙燕姿《第一天》", "周杰伦《七里香》", "房东的猫《美好事物》", "陈绮贞《旅行的意义》", "许巍《蓝莲花》", "告五人《披星戴月的想你》"] },
    { title: "婚礼歌单只能留下这一首", options: ["陶喆《就是爱你》", "周杰伦《简单爱》", "陈奕迅《稳稳的幸福》", "五月天《天使》", "方大同《特别的人》", "王力宏《唯一》"] },
    { title: "深夜便利店里最适合响起", options: ["张悬《喜欢》", "郭顶《水星记》", "陈奕迅《好久不见》", "孙燕姿《我也很想他》", "蔡健雅《达尔文》", "朴树《那些花儿》"] },
    { title: "离开一座城市时你想听", options: ["李宗盛《山丘》", "朴树《平凡之路》", "陈奕迅《陀飞轮》", "孙燕姿《尚好的青春》", "许巍《故乡》", "周杰伦《一路向北》"] },
    { title: "想安静地消化情绪时", options: ["纯钢琴版本", "低声女嗓", "木吉他民谣", "粤语慢歌", "氛围电子", "完全保持安静"] },
    { title: "只能保留一位华语男歌手", options: ["陈奕迅", "周杰伦", "林俊杰", "张学友", "陶喆", "李宗盛"] },
    { title: "最想长期关注哪支新生代乐队", options: ["告五人", "康士坦的变化球", "椅子乐团", "柏林护士", "回春丹", "橘子海"] },
    { title: "只能保留一位独立女声", options: ["陈绮贞", "张悬", "魏如萱", "郑宜农", "陈珊妮", "戴佩妮"] },
    { title: "谁最适合替你的青春配乐", options: ["五月天", "孙燕姿", "周杰伦", "苏打绿", "陈奕迅", "梁静茹"] },
    { title: "华语 R&B 里你最看重", options: ["丝滑转音", "律动鼓点", "和声层次", "都市感歌词", "复古音色", "实验编曲"] },
    { title: "独立音乐歌单必须保留", options: ["后摇", "独立摇滚", "Dream Pop", "民谣", "电子", "实验噪音"] },
    { title: "粤语歌最吸引你的部分", options: ["歌词韵脚", "经典旋律", "歌手声线", "城市气息", "怀旧记忆", "电影感"] },
    { title: "民谣歌单更适合哪种质感", options: ["公路感", "校园感", "西北旷野", "南方小城", "卧室独白", "乐队化编曲"] },
    { title: "电子华语歌你偏爱哪一类", options: ["City Pop", "Synth Pop", "House", "氛围电子", "国风电子", "实验舞曲"] },
    { title: "理想的小型现场在哪里", options: ["海边舞台", "老厂房", "屋顶天台", "爵士酒吧", "剧院", "校园礼堂"] },
    { title: "演唱会返场只能选一首", options: ["全场大合唱", "冷门私藏", "出道代表作", "新专辑主打", "安静抒情歌", "高能摇滚曲"] },
    { title: "你通常怎样发现一首新歌", options: ["朋友推荐", "算法日推", "影视配乐", "现场演出", "乐评歌单", "主动翻专辑"] },
    { title: "你整理华语歌单的方式", options: ["按情绪", "按年代", "按歌手", "按场景", "从不整理", "每月新建一张"] },
    { title: "什么最容易让你切掉一首歌", options: ["前奏太长", "歌词无感", "音色不合", "副歌太俗", "编曲太满", "几乎不会切歌"] },
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
    { title: "公路尽头最适合响起", options: ["Fleetwood Mac《Dreams》", "Bruce Springsteen《Born to Run》", "The Killers《Mr. Brightside》", "Oasis《Don't Look Back in Anger》", "Avicii《The Nights》", "Coldplay《Paradise》"] },
    { title: "日落时只能播放一首", options: ["Frank Ocean《Pink + White》", "Harry Styles《Golden》", "Lana Del Rey《West Coast》", "Tame Impala《Borderline》", "SZA《Good Days》", "The Beatles《Here Comes the Sun》"] },
    { title: "婚礼舞池第一首歌", options: ["Bruno Mars《Marry You》", "Ed Sheeran《Thinking Out Loud》", "Beyoncé《Love On Top》", "Taylor Swift《Lover》", "Elton John《Your Song》", "Etta James《At Last》"] },
    { title: "深夜城市适合哪首歌", options: ["The Weeknd《After Hours》", "M83《Midnight City》", "Arctic Monkeys《Do I Wanna Know?》", "Joji《Glimpse of Us》", "Cigarettes After Sex《K.》", "Lorde《Ribs》"] },
    { title: "需要独自重新出发时", options: ["Miley Cyrus《Flowers》", "Florence + The Machine《Shake It Out》", "Sia《Unstoppable》", "Kelly Clarkson《Stronger》", "Lizzo《Good as Hell》", "Ariana Grande《thank u, next》"] },
    { title: "想彻底放空时你会选", options: ["Ambient", "Acoustic Folk", "Dream Pop", "Slow Jazz", "Piano Solo", "保持安静"] },
    { title: "只能保留一位欧美男歌手", options: ["Bruno Mars", "The Weeknd", "Harry Styles", "Frank Ocean", "Ed Sheeran", "Kendrick Lamar"] },
    { title: "哪支独立乐队值得一直追", options: ["Arctic Monkeys", "Tame Impala", "The 1975", "Vampire Weekend", "The Strokes", "Florence + The Machine"] },
    { title: "只能保留一位创作女声", options: ["Taylor Swift", "Lana Del Rey", "Lorde", "Phoebe Bridgers", "SZA", "Olivia Rodrigo"] },
    { title: "谁最适合替你的电影配乐", options: ["Hans Zimmer", "John Williams", "Ludwig Göransson", "Trent Reznor", "Alexandre Desplat", "Ennio Morricone"] },
    { title: "欧美 R&B 你更偏爱", options: ["Neo Soul", "Alternative R&B", "Classic Soul", "Funk", "Quiet Storm", "Contemporary R&B"] },
    { title: "摇滚歌单必须保留", options: ["Classic Rock", "Alternative Rock", "Punk", "Britpop", "Grunge", "Post-Rock"] },
    { title: "电子音乐更吸引你的方向", options: ["House", "Techno", "Disco", "Drum & Bass", "Ambient", "Synthwave"] },
    { title: "Hip-Hop 歌单最看重", options: ["Flow", "歌词叙事", "Beat", "采样", "现场能量", "实验性"] },
    { title: "民谣与乡村你偏爱", options: ["Indie Folk", "Americana", "Country Pop", "Singer-Songwriter", "Bluegrass", "Folk Rock"] },
    { title: "理想的欧美现场在哪里", options: ["体育场", "沙漠音乐节", "地下俱乐部", "森林舞台", "百年剧院", "屋顶演出"] },
    { title: "音乐节压轴应该属于", options: ["流行巨星", "传奇乐队", "Hip-Hop 头牌", "电子 DJ", "独立新声", "全明星合作"] },
    { title: "你通常怎样发现欧美新歌", options: ["流媒体日推", "朋友歌单", "电影剧集", "音乐节阵容", "乐评媒体", "主动听新专辑"] },
    { title: "你整理欧美歌单的方式", options: ["按曲风", "按年代", "按情绪", "按艺人", "按场景", "从不整理"] },
    { title: "一首歌让你留下的第一原因", options: ["前奏", "主唱音色", "副歌", "歌词", "节奏", "制作细节"] },
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
    { title: "夜晚汉江边最适合播放", options: ["NewJeans《Ditto》", "IU《Palette》", "DEAN《D (half moon)》", "BTS《Life Goes On》", "TAEYEON《Weekend》", "AKMU《How People Move》"] },
    { title: "夏日出发第一首 KPOP", options: ["Red Velvet《Red Flavor》", "TWICE《Dance The Night Away》", "WINNER《REALLY REALLY》", "SISTAR《Touch My Body》", "SEVENTEEN《Oh My!》", "NewJeans《Hype Boy》"] },
    { title: "婚礼歌单里的 KPOP", options: ["IU《Blueming》", "EXO《For Life》", "SEVENTEEN《Darling》", "BOL4《Some》", "AKMU《Love Lee》", "Red Velvet《Would U》"] },
    { title: "练习室最后一遍要跳", options: ["aespa《Drama》", "NCT 127《Kick It》", "ITZY《LOCO》", "Stray Kids《MANIAC》", "LE SSERAFIM《Eve, Psyche & The Bluebeard's wife》", "ATEEZ《Wonderland》"] },
    { title: "需要被安慰时你会听", options: ["IU《Love poem》", "BTS《Spring Day》", "LeeHi《BREATHE》", "SEVENTEEN《Circles》", "TAEYEON《Fine》", "BOL4《To My Youth》"] },
    { title: "想让大脑彻底放空时", options: ["K-R&B", "Ballad", "Acoustic", "Dream Pop", "Piano Cover", "完全安静"] },
    { title: "只能保留一个男团", options: ["BTS", "EXO", "SEVENTEEN", "NCT", "Stray Kids", "SHINee"] },
    { title: "只能保留一位女 SOLO", options: ["IU", "TAEYEON", "SUNMI", "CHUNG HA", "BIBI", "HEIZE"] },
    { title: "最想长期关注的新生代团体", options: ["IVE", "aespa", "LE SSERAFIM", "NewJeans", "RIIZE", "BABYMONSTER"] },
    { title: "谁最适合替青春韩剧配乐", options: ["IU", "TAEYEON", "Crush", "Paul Kim", "AKMU", "10CM"] },
    { title: "K-R&B 最吸引你的部分", options: ["丝滑声线", "松弛节拍", "和声", "都市夜色", "说唱段落", "极简制作"] },
    { title: "女团歌你偏爱哪种概念", options: ["清新", "Girl Crush", "梦幻", "复古", "Y2K", "暗黑"] },
    { title: "男团歌你偏爱哪种方向", options: ["强烈舞曲", "清爽青春", "Hip-Hop", "R&B", "摇滚", "抒情"] },
    { title: "KPOP 舞曲最重要的是", options: ["副歌记忆点", "编舞", "Beat", "概念视觉", "成员声线", "舞台改编"] },
    { title: "OST 歌单必须保留", options: ["浪漫爱情", "青春成长", "悬疑氛围", "古装史诗", "治愈日常", "悲剧情绪"] },
    { title: "最想体验哪一种 KPOP 现场", options: ["首尔安可场", "打歌初放送", "大学庆典", "年末舞台", "小型 Showcase", "海外音乐节"] },
    { title: "演唱会最期待哪个环节", options: ["开场 VCR", "主打连唱", "成员 Solo", "安可互动", "全场合唱", "未公开新歌"] },
    { title: "你通常怎样发现 KPOP 新歌", options: ["打歌舞台", "短视频挑战", "朋友安利", "专辑试听", "综艺节目", "随机播放"] },
    { title: "你整理 KPOP 歌单的方式", options: ["按团体", "按代际", "按概念", "按场景", "按回归期", "从不整理"] },
    { title: "决定收藏一首 KPOP 的瞬间", options: ["副歌", "舞蹈片段", "主唱高音", "Rap", "Bridge", "现场版本"] },
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
    { title: "夕阳下最适合响起的动画歌", options: ["RADWIMPS《スパークル》", "supercell《君の知らない物語》", "Aimer《茜さす》", "Galileo Galilei《青い栞》", "ClariS《コネクト》", "ヨルシカ《晴る》"] },
    { title: "冒险出发时只能播放一首", options: ["和田光司《Butter-Fly》", "FLOW《GO!!!》", "YUI《again》", "KANA-BOON《シルエット》", "SPYAIR《イマジネーション》", "LiSA《紅蓮華》"] },
    { title: "告白场景最适合哪首歌", options: ["花澤香菜《恋愛サーキュレーション》", "Goose house《光るなら》", "Aimer《カタオモイ》", "supercell《君の知らない物語》", "ClariS《コネクト》", "RADWIMPS《なんでもないや》"] },
    { title: "最终决战前的配乐", options: ["澤野弘之《YouSeeBIGGIRL/T:T》", "梶浦由記《the battle is to the strong》", "Linked Horizon《心臓を捧げよ！》", "JAM Project《THE HERO!!》", "SiM《The Rumbling》", "川井憲次《謡III》"] },
    { title: "想回到某个夏天时", options: ["secret base", "久石让《Summer》", "Galileo Galilei《青い栞》", "Lia《鳥の詩》", "奥華子《変わらないもの》", "ZONE《true blue》"] },
    { title: "需要安静进入另一个世界", options: ["吉卜力钢琴", "治愈系 OST", "Ambient Game Music", "雨声 Lo-fi", "纯管弦配乐", "完全安静"] },
    { title: "只能保留一位 Anisong 女歌手", options: ["LiSA", "Aimer", "ReoNa", "藍井エイル", "May'n", "TRUE"] },
    { title: "只能保留一支日系动画乐队", options: ["FLOW", "SPYAIR", "ASIAN KUNG-FU GENERATION", "BUMP OF CHICKEN", "UNISON SQUARE GARDEN", "KANA-BOON"] },
    { title: "最想长期关注哪位 Vocaloid P", options: ["DECO*27", "ピノキオピー", "Ayase", "Mitchie M", "すりぃ", "Kanaria"] },
    { title: "谁最适合替幻想世界配乐", options: ["久石让", "梶浦由记", "泽野弘之", "植松伸夫", "下村阳子", "光田康典"] },
    { title: "动画摇滚 OP 你最看重", options: ["热血副歌", "吉他 Riff", "主唱爆发", "剧情呼应", "现场感", "片头画面同步"] },
    { title: "Vocaloid 歌单偏爱哪种风格", options: ["高速电子", "摇滚", "暗黑叙事", "可爱电波", "抒情", "实验音声"] },
    { title: "游戏原声必须保留哪一类", options: ["战斗曲", "主城音乐", "Boss 战", "角色主题", "片尾曲", "环境氛围"] },
    { title: "二次元抒情歌最重要的是", options: ["剧情记忆", "声优声线", "旋律", "歌词", "管弦编曲", "钢琴前奏"] },
    { title: "音游曲你更偏爱", options: ["高速 Hardstyle", "Future Bass", "钢琴曲", "Vocaloid", "摇滚", "交响电子"] },
    { title: "最想体验哪一种二次元现场", options: ["Animelo Summer Live", "游戏交响音乐会", "Vocaloid 虚拟演唱会", "声优 Live", "日系乐队 Livehouse", "同人音乐展"] },
    { title: "演出安可最想听到", options: ["经典 OP", "全员合唱", "角色歌", "未公开新曲", "抒情 ED", "纯音乐返场"] },
    { title: "你通常怎样发现二次元音乐", options: ["追番", "音游", "朋友推荐", "MAD / AMV", "作曲家作品", "随机歌单"] },
    { title: "你整理二次元歌单的方式", options: ["按作品", "按角色", "按作曲家", "按年代", "按场景", "从不整理"] },
    { title: "什么最容易让你收藏一首动画歌", options: ["副歌燃点", "剧情加成", "歌手声线", "编曲细节", "歌词共鸣", "现场版本"] },
  ],
};

function buildBank(channel: ChannelKey, rawQuestions: RawQuestion[]) {
  return rawQuestions.map((question, index): Question => ({
    ...question,
    id: `${channel}-${String(index + 1).padStart(2, "0")}`,
    category: categoryByIndex[index],
    profileKeys: profilePatterns[index % profilePatterns.length],
  }));
}

export const questionBanks = Object.fromEntries(
  (Object.keys(rawQuestionBanks) as ChannelKey[]).map((channel) => [channel, buildBank(channel, rawQuestionBanks[channel])]),
) as Record<ChannelKey, Question[]>;

export function legacyQuestionIds(channel: ChannelKey) {
  return questionBanks[channel].slice(0, QUESTION_COUNT).map(({ id }) => id);
}

export function questionsForIds(channel: ChannelKey, ids: string[]) {
  const byId = new Map(questionBanks[channel].map((question) => [question.id, question]));
  return ids.map((id) => byId.get(id)).filter((question): question is Question => Boolean(question));
}

export function questionSelectionError(channel: ChannelKey, ids: unknown) {
  if (!Array.isArray(ids) || ids.length !== QUESTION_COUNT) return `题组必须包含 ${QUESTION_COUNT} 道题`;
  if (ids.some((id) => typeof id !== "string")) return "题组 ID 格式异常";
  if (new Set(ids).size !== QUESTION_COUNT) return "题组中存在重复题目";
  const validIds = new Set(questionBanks[channel].map(({ id }) => id));
  if (ids.some((id) => !validIds.has(id))) return "题组包含未知或跨频道题目";
  return "";
}

function secureRandom() {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] / 0x1_0000_0000;
}

export function shuffle<T>(values: T[], random: () => number = secureRandom) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function sampleQuestionIds(channel: ChannelKey, random: () => number = secureRandom) {
  const categoryOrder = shuffle(questionCategories, random);
  const selected = categoryOrder.flatMap((category, index) => {
    const quota = index < 4 ? 3 : 2;
    return shuffle(questionBanks[channel].filter((question) => question.category === category), random).slice(0, quota);
  });
  return shuffle(selected, random).map(({ id }) => id);
}
