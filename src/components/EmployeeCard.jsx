import { User, Star, Briefcase, AlertCircle } from 'lucide-react';
import WorkloadIndicator from './WorkloadIndicator';

export default function EmployeeCard({ employee, onClick }) {
  const statusColors = {
    available: 'bg-emerald-500',
    busy: 'bg-amber-500',
    overloaded: 'bg-rose-500'
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-cyan-300 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{employee.name}</h3>
            <p className="text-sm text-slate-500">{employee.email}</p>
            <p className="text-xs text-slate-400">{employee.userId}</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${statusColors[employee.status]}`} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="text-slate-600">Productivity:</span>
          <span className="font-medium text-slate-800">{employee.productivityScore || 0}%</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="w-4 h-4 text-cyan-500" />
          <span className="text-slate-600">Tasks:</span>
          <span className="font-medium text-slate-800">
            {employee.completedTaskCount || 0}/{employee.taskCount || 0}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Capacity:</span>
          <span className="font-medium text-slate-800">{employee.capacity}</span>
        </div>

        {employee.stressLevel > 3 && (
          <div className="flex items-center gap-2 text-sm text-rose-600">
            <AlertCircle className="w-4 h-4" />
            <span>High stress level</span>
          </div>
        )}

        <div className="pt-2">
          <p className="text-xs text-slate-500 mb-1">Workload</p>
          <WorkloadIndicator workload={employee.workload} />
        </div>

        <div className="pt-2">
          <div className="flex flex-wrap gap-1">
            {employee.skills?.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md"
              >
                {skill}
              </span>
            ))}
            {employee.skills?.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                +{employee.skills.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
