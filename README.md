# FINQ – India's First Family-Centric Finance Management Platform 🚀

*Building trust through transparency in family finance management*

---

## 🎯 **Project Vision**

FINQ transforms how Indian families manage money together through transparency, trust, and seamless collaboration. From joint family budgets to student event planning - making financial management inclusive, interactive, and secure.

**Mission Statement**: *"To simplify money management for Indian households with a secure, family-first Cash + UPI + Budget Tracker that builds trust through transparency, without complexity."*

---

## 🔹 **Project Purpose**

FINQ is a comprehensive, secure, and family-friendly finance platform that helps users:
- Track Cash + UPI expenses seamlessly
- Manage family budgets collaboratively  
- Enable transparent financial communication
- Build saving habits through positive motivation
- Provide local language accessibility (Hindi-first)

---

## 💡 **Why FINQ? (Unique Value Proposition)**

### **Market Gaps We Address:**
✅ **Family-First Approach** → Unlike individual-focused apps, FINQ is built for families  
✅ **Cash + UPI Hybrid Tracking** → Comprehensive expense management  
✅ **Built-in Family Communication** → Chat features for financial discussions  
✅ **Transparency Without Judgment** → Trust-building through visibility  
✅ **Local Language Support** → Hindi-first interface for broader accessibility  
✅ **WhatsApp-like Simplicity** → Familiar, intuitive user experience  

---

## 🤝 **Target Audience**

### **Primary Users:**
- **Families** → Joint household budget management with transparency
- **Students** → Event planning, hostel expenses, group fund management
- **Small Communities** → Housing societies, friend groups, small teams

### **Use Cases:**
- **Joint Family Budgets** → Parents and children tracking shared expenses
- **Student Events** → Farewell parties, trips, group activities
- **Roommate Expenses** → Flat rent, utilities, groceries split management
- **Small Business** → Family shops tracking daily cash + UPI flows

---

## 🏗️ **Current Architecture**

### **Backend (Express.js API)**
```
├── Health Check (/api/v1/health)
├── Budget Management (/api/v1/budget)
├── Transaction CRUD (/api/v1/transactions)
└── CORS + JSON middleware
```

### **Frontend (Vanilla JavaScript)**
```
├── Responsive Dashboard UI
├── Real-time Transaction Management
├── Budget Progress Tracking
├── Dark/Light Theme Toggle
├── Category-wise Expense Filtering
└── API Integration with Fetch
```

### **Current Tech Stack**
- **Backend**: Node.js + Express.js
- **Database**: In-memory (PostgreSQL planned)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Development**: Nodemon, Git
- **Hosting**: Local development (Railway/Render planned)

---

## 🚀 **Development Roadmap**

### **✅ Phase 1: Foundation (COMPLETED)**
- ✅ Basic transaction API with CRUD operations
- ✅ Frontend-backend integration
- ✅ Real-time budget tracking
- ✅ Responsive UI with theme support

### **🔄 Phase 2: Authentication (IN PROGRESS)**
- 🎯 User registration/login system
- 🎯 Password security (bcrypt + JWT)
- 🎯 Email verification workflow
- 🎯 Responsive login/signup UI

### **📋 Phase 3: Family Core (PLANNED)**
- Family creation & invitation system
- Role-based access (Admin/Member)
- Shared budget management
- Family member transaction visibility

### **📋 Phase 4: Communication Hub (PLANNED)**
- Real-time family chat integration
- Transaction-linked discussions
- File sharing for receipts
- Push notifications

### **📋 Phase 5: Advanced Features (PLANNED)**
- Spending pattern analysis
- Budget recommendations
- Multiple family/group support
- Mobile app development

*📋 [Detailed Roadmap](./ROADMAP.md) - Complete development timeline and strategy*

---

## 🛠️ **Installation & Setup**

### **Prerequisites**
- Node.js (v16+)
- npm or yarn
- Git

### **Quick Start**
```bash
# Clone the repository
git clone https://github.com/yourusername/FINQ.git
cd FINQ

# Install backend dependencies
cd finq-backend
npm install

# Start development server
npm run dev

# Server runs on http://localhost:8080
# API endpoints available at http://localhost:8080/api/v1/
```

### **API Endpoints**
```
GET    /api/v1/health           → Health check
GET    /api/v1/budget           → Get current budget
POST   /api/v1/budget           → Update budget
GET    /api/v1/transactions     → List all transactions
POST   /api/v1/transactions     → Create transaction
PUT    /api/v1/transactions/:id → Update transaction
DELETE /api/v1/transactions/:id → Delete transaction
```

---

## 📊 **Features Overview**

### **Current Features (MVP)**
- ✅ **Real-time Dashboard** → Income, expenses, budget progress
- ✅ **Transaction Management** → Add, edit, delete with categories
- ✅ **Budget Tracking** → Visual progress bars and limits
- ✅ **Responsive Design** → Works on desktop and mobile
- ✅ **Theme Support** → Dark/light mode toggle
- ✅ **Category Filtering** → Filter by transaction type/category
- ✅ **Local Storage Backup** → Fallback data persistence

### **Upcoming Features**
- 🔄 **User Authentication** → Secure login/signup
- 📋 **Family Management** → Multi-user family accounts
- 📋 **Real-time Chat** → Family financial discussions
- 📋 **Advanced Analytics** → Spending insights and trends
- 📋 **Mobile App** → Native iOS/Android applications

---

## 🎨 **Design Philosophy**

### **User Experience Principles**
- **Simplicity First** → WhatsApp-like ease of use
- **Family-Centric** → Built for collaboration, not individual use
- **Trust Through Transparency** → All family members see the same data
- **Positive Motivation** → Encourage saving habits without guilt
- **Cultural Sensitivity** → Hindi-first, Indian family values

### **Technical Principles**
- **Security by Design** → Multi-layer data protection
- **Scalability** → Built to handle growing families and communities
- **Performance** → Fast loading, responsive interactions
- **Accessibility** → Works across devices and language preferences

---

## 🌟 **Screenshots**

### Dashboard Overview
![FINQ Dashboard](https://github.com/user-attachments/assets/10e2e15c-222d-4497-9437-e34f745c8ed6)
*Real-time family budget tracking with transparent expense visibility*

---

## 🤝 **Contributing**

We welcome contributions from developers who believe in transparent family finance management!

### **How to Contribute**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Contribution Areas**
- 🔧 Backend API development
- 🎨 UI/UX improvements
- 📱 Mobile responsiveness
- 🌐 Localization (Hindi, regional languages)
- 🔒 Security enhancements
- 📊 Analytics features

---

## 📈 **Project Stats**

- **Current Version**: v1.0 (MVP)
- **Development Phase**: Authentication System
- **Target Launch**: Public Beta (Month 4)
- **Market Focus**: Indian families, student communities
- **Tech Stack**: Node.js + Express + Vanilla JS

---

## 🛡️ **Security & Privacy**

- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **Authentication**: JWT-based secure session management
- **Privacy First**: Family data isolated, no cross-family data access
- **Local Control**: Option for local-first data storage
- **Compliance**: GDPR-ready data handling practices

---

## 📞 **Support & Contact**

- **Email**: tanish.vortex250@gmail.com
- **LinkedIn**: www.linkedin.com/in/thetanish

---

## 📜 **License**

This project is licensed under the MIT License.

---

## 🙏 **Acknowledgments**

- **Family Finance Management** inspiration from real Indian household needs
- **Open Source Community** for tools and frameworks
- **Early Testers** providing valuable feedback and insights
- **Indian Fintech Ecosystem** for market understanding

---

*"Great families manage money together. FINQ makes it simple, secure, and transparent."*

**Built with ❤️ for Indian families by TANISH** 🚀