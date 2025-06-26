# 🎓 VocabLearn - AI-Powered Vocabulary Learning Platform

**Developed entirely by Hekimcan Aktaş**

A comprehensive, modern vocabulary learning application that combines spaced repetition algorithms, AI-powered content generation, and gamification to create an engaging language learning experience.

---

## ✨ Features

### 🧠 Smart Learning System
- **Spaced Repetition Algorithm**: Implements the scientifically-proven 6 Sefer method for optimal memory retention
- **Adaptive Difficulty**: Automatically adjusts word difficulty based on user performance
- **Progress Tracking**: Comprehensive analytics and learning statistics
- **Personalized Learning Path**: Customized word selection based on user preferences

### 🎮 Gamification Elements
- **Interactive Wordle Game**: Custom Wordle implementation using user's vocabulary
- **Quiz System**: Multiple choice and fill-in-the-blank questions
- **Achievement System**: Progress badges and milestones
- **Daily Challenges**: Consistent learning motivation

### 🤖 AI Integration
- **Story Generation**: AI-powered bilingual stories incorporating user's vocabulary
- **Image Generation**: Custom visual aids using OpenAI's DALL-E
- **Smart Prompts**: Context-aware content generation
- **Multilingual Support**: Turkish-English vocabulary focus

### 📊 Analytics & Insights
- **Learning Statistics**: Detailed progress reports and analytics
- **Performance Metrics**: Success rates, streak tracking, and improvement trends
- **PDF Reports**: Exportable learning summaries
- **Visual Charts**: Interactive data visualization

### 🎨 Modern UI/UX
- **Premium Design**: Glass morphism effects and gradient backgrounds
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Dark/Light Mode**: Adaptive theming support
- **Smooth Animations**: Polished user interactions

---

## 🛠 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security** - Data protection
- **Real-time Subscriptions** - Live updates

### AI & External Services
- **OpenAI GPT-4** - Text and image generation
- **Supabase Auth** - User authentication
- **Vercel** - Deployment and hosting

### Development Tools
- **ESLint & Prettier** - Code quality
- **Husky** - Git hooks
- **TypeScript** - Static type checking

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/hekimcanaktas/vocabularylearningapp.git
cd vocabularylearningapp
```

2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Environment Setup
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Database Setup
Run the SQL scripts in order:
```bash
# Execute scripts/01-initial-schema.sql through scripts/17-fix-infinite-recursion-policies.sql
# in your Supabase SQL editor
```

5. Start Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit `http://localhost:3000` to see the application.

---

## 📁 Project Structure

```
├── app/
│   ├── auth/
│   ├── dashboard/
│   ├── words/
│   ├── learn/
│   ├── quiz/
│   ├── wordle/
│   ├── stories/
│   ├── gorsel-uret/
│   ├── analytics/
│   └── api/
├── components/
│   ├── ui/
│   └── layout/
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   └── spaced-repetition.ts
├── hooks/
├── scripts/
└── styles/
```

---

## 🔧 Key Features Implementation

### Spaced Repetition Algorithm
Implements the 6 Sefer method with customizable intervals:
- New words: Immediate review
- Learning: 1 day, 3 days, 1 week intervals
- Mastered: 2 weeks, 1 month, 3 months

### AI Story Generation
- Contextual story creation using user's vocabulary
- Bilingual content (Turkish-English)
- Image generation for visual storytelling
- Vocabulary highlighting and definitions

### Wordle Game Integration
- Custom implementation using user's word database
- Color-coded feedback system
- Hint system with translations
- Progress tracking and statistics

### Advanced Analytics
- Learning curve visualization
- Word mastery progression
- Time-based performance metrics
- Exportable PDF reports

---

## 🔒 Security Features

- Row Level Security (RLS) on all database tables
- JWT-based authentication via Supabase Auth
- API route protection with middleware
- Input validation and sanitization
- CORS configuration for API security

---

## 🎯 Performance Optimizations

- Server-side rendering with Next.js
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Database query optimization
- Caching strategies for API responses

---

## 📱 Mobile Responsiveness

- Progressive Web App (PWA) capabilities
- Touch-optimized interfaces
- Responsive grid layouts
- Mobile-first design approach

---

## 🧪 Testing & Quality Assurance

- TypeScript for compile-time error checking
- ESLint for code quality
- Prettier for consistent formatting
- Component testing with React Testing Library

---

## 🚀 Deployment

The application is optimized for deployment on:
- Vercel (recommended)
- Netlify
- Railway
- Self-hosted solutions

### Vercel Deployment
```bash
npm run build
vercel --prod
```

---

## 🤝 Contributing

This project was developed entirely by **Hekimcan Aktaş**.

For contributions:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenAI for GPT-4 and DALL-E integration
- Supabase for backend infrastructure
- Vercel for hosting and deployment
- shadcn/ui for component library
- Tailwind CSS for styling framework

---

## 📞 Contact

**Developer**: Hekimcan Aktaş
- GitHub: [@hekimcanaktas](https://github.com/hekimcanaktas)
- Email: hekimcanaktas@gmail.com

---

**Built with ❤️ by Hekimcan Aktaş**
