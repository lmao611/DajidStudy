/**
 * Database Layer / Local Data Store for DajidStudy
 * Provides persistent memory and data management for Profile, Schedules, and Vocabularies.
 */

export const db = {
  profile: {
    name: "Dajid",
    nickname: "Dajid Developer",
    role: "Lập trình viên & Người học suốt đời (Lifelong Learner)",
    bio: "Chào bạn! Đây là không gian số cá nhân của tôi — nơi tôi chia sẻ về hành trình phát triển bản thân, theo dõi lịch trình học tập mỗi ngày và ghi chép kho từ vựng yêu thích.",
    avatar: "/avatar.svg",
    quote: "“Kỷ luật là cầu nối giữa mục tiêu và thành tựu.”",
    location: "Việt Nam",
    status: "Đang cày cuốc công nghệ mới 🚀",
    stats: {
      totalHoursStudied: 142,
      completedTasks: 38,
      streakDays: 14,
      wordsLearned: 65,
    },
    skills: [
      { name: "React / Frontend", level: 85, color: "from-blue-500 to-cyan-400" },
      { name: "Node.js / Express", level: 80, color: "from-emerald-500 to-teal-400" },
      { name: "Database & APIs", level: 75, color: "from-indigo-500 to-purple-500" },
      { name: "Tiếng Anh Chuyên ngành", level: 78, color: "from-amber-500 to-orange-400" },
      { name: "Tự học & Nghiên cứu", level: 90, color: "from-pink-500 to-rose-400" },
    ],
    goals: [
      { id: 1, title: "Luyện 30 phút từ vựng mỗi ngày", done: true, tag: "Ngoại ngữ" },
      { id: 2, title: "Hoàn thiện dự án Web Cá nhân DajidStudy", done: false, tag: "Coding" },
      { id: 3, title: "Đọc 10 trang sách kỹ thuật / tư duy", done: false, tag: "Thói quen" },
      { id: 4, title: "Tối ưu hóa thời gian biểu học tập hàng tuần", done: true, tag: "Kỷ luật" },
    ]
  },

  schedules: [
    {
      id: "sch-1",
      subject: "Luyện thuật toán & Cấu trúc dữ liệu",
      dayOfWeek: "Thứ 2",
      timeStart: "08:30",
      timeEnd: "10:30",
      location: "Bàn học / LeetCode",
      type: "Coding",
      completed: true,
      notes: "Luyện 2 bài Tree Traversal & ôn lại Dynamic Programming"
    },
    {
      id: "sch-2",
      subject: "Học Từ vựng Tiếng Anh Chuyên ngành",
      dayOfWeek: "Thứ 2",
      timeStart: "14:00",
      timeEnd: "15:15",
      location: "Phòng ngủ / Flashcard DajidStudy",
      type: "Ngoại ngữ",
      completed: true,
      notes: "Học 15 từ vựng chủ đề System Design"
    },
    {
      id: "sch-3",
      subject: "Xây dựng RESTful API Backend",
      dayOfWeek: "Thứ 3",
      timeStart: "09:00",
      timeEnd: "11:30",
      location: "Thư viện",
      type: "Project",
      completed: false,
      notes: "Viết Controller, Route và Middleware validation"
    },
    {
      id: "sch-4",
      subject: "Đọc tài liệu React & Clean Architecture",
      dayOfWeek: "Thứ 4",
      timeStart: "15:30",
      timeEnd: "17:00",
      location: "Cafe sách",
      type: "Nghiên cứu",
      completed: false,
      notes: "Tìm hiểu State Management & Component Composition"
    }
  ],

  vocabularies: [
    {
      id: "voc-1",
      word: "Resilience",
      phonetic: "/rɪˈzɪl.jəns/",
      partOfSpeech: "noun",
      meaning: "Khả năng phục hồi, kiên cường vượt qua khó khăn",
      example: "Emotional resilience is essential for handling stressful challenges.",
      topic: "Phát triển bản thân",
      isMastered: true
    },
    {
      id: "voc-2",
      word: "Architecture",
      phonetic: "/ˈɑː.kɪ.tek.tʃər/",
      partOfSpeech: "noun",
      meaning: "Kiến trúc hệ thống / phần mềm, cách tổ chức mã nguồn",
      example: "A modular architecture makes code maintenance and testing much simpler.",
      topic: "Công nghệ",
      isMastered: true
    },
    {
      id: "voc-3",
      word: "Asynchronous",
      phonetic: "/eɪˈsɪŋ.krə.nəs/",
      partOfSpeech: "adjective",
      meaning: "Bất đồng bộ (không diễn ra cùng một thời điểm)",
      example: "Node.js is renowned for handling asynchronous I/O operations efficiently.",
      topic: "Công nghệ",
      isMastered: false
    },
    {
      id: "voc-4",
      word: "Consistency",
      phonetic: "/kənˈsɪs.tən.si/",
      partOfSpeech: "noun",
      meaning: "Sự nhất quán, kiên trì đều đặn mỗi ngày",
      example: "Consistency in daily study produces greater results than cramming.",
      topic: "Học tập",
      isMastered: false
    }
  ]
};
