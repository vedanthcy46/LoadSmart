# LoadSmart - AI-Powered Workforce Optimization & Task Management

LoadSmart is a comprehensive task management and employee productivity platform designed to balance workloads, monitor employee well-being, and leverage AI for smart task allocation and insights.

## 🚀 Technology Stack

### Frontend
- **React.js**: Core UI framework for a reactive and component-based interface.
- **Tailwind CSS**: Modern utility-first CSS for a premium, responsive design.
- **Recharts**: For dynamic, interactive data visualizations and charts.
- **Lucide React**: For consistent and high-quality iconography.
- **Axios**: For seamless API communication with the backend.
- **React Router**: For client-side navigation and protected routing.

### Backend
- **Node.js & Express**: High-performance backend server architecture.
- **MongoDB & Mongoose**: NoSQL database for flexible and scalable data storage.
- **Groq AI SDK**: Powers the intelligence layer of the application for workload insights and task recommendations.
- **JWT (JSON Web Tokens)**: Secure authentication and role-based access control (Admin vs. Employee).

---

## 🛠️ Core Features

### 1. Admin Dashboard
A central command center for managers to monitor the entire organization at a glance.
- **Real-time Stats**: Track total employees, total tasks, overall productivity, and the number of overloaded staff.
- **Interactive Charts**: 
    - **Task Status Distribution**: Visual breakdown of Pending, In Progress, and Completed tasks.
    - **Workload Distribution**: Pie chart showing team health (Low, Balanced, Overloaded).
    - **Priority Breakdown**: Insights into High, Medium, and Low priority tasks.
- **Team Leaderboard**: A gamified list of top performers based on a dynamic "Productivity Score" (weighted by task completion and base performance). Managers can award badges or commendations directly from here.

### 2. Smart Task Allocation (AI-Powered)
- **Automatic Splitting**: Admins can enter a complex task description, and the **Groq AI** engine will automatically split it into logical sub-tasks.
- **Intelligent Assignment**: Tasks are assigned based on **Skill Matching** and **Current Workload**. The system ensures that no employee is assigned a task they aren't skilled for or that would push them into "Overload" status (>80% workload).
- **Manual Control**: Admins still maintain the ability to manually adjust assignments and priorities.

### 3. Productivity & Performance Metrics
- **Dynamic Productivity Score**: Calculated in real-time as `(Completed Tasks / Total Tasks) * 100`. This ensures the performance data is always live and not static.
- **Workload Balancing**: Workload is calculated as `(Active Tasks / Capacity) * 100`. This prevents burnout and ensures equal task distribution across the team.

### 4. Stress Monitoring & Employee Well-being
- **Feedback Form**: Employees can submit daily check-ins including their stress levels (1-5) and specific notes about their current mental state or hurdles.
- **AI Analysis**: Admins can request an **AI Stress Analysis** for any employee. The system analyzes the employee's recent feedback and task load to provide personalized recommendations for the manager (e.g., "Recommend a half-day break" or "Reassign high-priority tasks").

### 5. Employee Management (CRUD)
- **Full Control**: Admins can create new employees with specific skills, email addresses, and daily capacities.
- **Editing**: Full ability to update employee details, including changing their skills or increasing/decreasing their capacity based on performance.
- **Search & Filter**: Global search bar to instantly find employees or tasks by name, ID, email, or skill.

---

## 🔄 The Workflow

### For Admins (Managers)
1.  **Onboarding**: Create employee accounts and assign their skills.
2.  **Task Creation**: Input a task. The AI splits it and suggests the best-fit employees based on skills and who has the lowest current workload.
3.  **Monitoring**: Use the Dashboard to see which projects are lagging and who is overloaded.
4.  **Reviewing**: When an employee finishes a task, it moves to "In Progress". The Admin verifies the work and moves it to "Completed", which updates the employee's productivity score.
5.  **Support**: Review stress feedback and take AI-recommended actions to support the team.

### For Employees
1.  **My Tasks**: View a personalized list of tasks assigned specifically to them.
2.  **Workflow Status**: Start a task to move it to "In Progress".
3.  **Well-being Check-in**: Submit stress feedback regularly to keep the manager informed of their status.
4.  **Growth**: Watch their Productivity Score and Leaderboard rank increase as they complete assignments.

---

## 🧠 AI Integration (Groq AI)
The project uses the **Llama-3 model via Groq** for near-instant responses:
- **Task Splitting**: Breaks down high-level project goals into actionable technical tasks.
- **Personalized Recommendations**: Analyzes team stats to give the manager advice on how to improve overall team efficiency.
- **Sentiment Analysis**: Analyzes employee feedback to detect signs of burnout before it happens.
