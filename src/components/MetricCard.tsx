import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  colorScheme: 'indigo' | 'emerald' | 'amber' | 'rose' | 'teal';
}

export default function MetricCard({ title, value, description, icon: Icon, colorScheme }: MetricCardProps) {
  const schemeClasses = {
    indigo: {
      text: 'text-indigo-900',
      iconBg: 'clay-blue text-white',
    },
    emerald: {
      text: 'text-emerald-900',
      iconBg: 'clay-green text-white',
    },
    amber: {
      text: 'text-amber-900',
      iconBg: 'bg-amber-400 text-white shadow-sm',
    },
    rose: {
      text: 'text-rose-900',
      iconBg: 'bg-rose-400 text-white shadow-sm',
    },
    teal: {
      text: 'text-teal-900',
      iconBg: 'bg-teal-400 text-white shadow-sm',
    }
  };

  const scheme = schemeClasses[colorScheme] || schemeClasses.indigo;

  return (
    <div className="p-6 rounded-[2rem] neu-flat border border-white/40 flex items-center justify-between transition-transform duration-300 hover:-translate-y-1">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">{title}</span>
        <span className="text-3xl font-extrabold text-[#444] font-sans">{value}</span>
        {description && <span className="text-[11px] font-medium text-slate-500 mt-1">{description}</span>}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${scheme.iconBg}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}
