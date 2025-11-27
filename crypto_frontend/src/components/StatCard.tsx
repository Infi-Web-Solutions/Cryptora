import React from "react";

interface StatCardProps {
  title: string;
  value?: string | number;
  children?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, children }) => {
  return (
    <div className="bg-secondary p-6 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      {value !== undefined ? (
        <p className="text-2xl font-bold text-foreground">{value}</p>
      ) : (
        children
      )}
    </div>
  );
};

export default StatCard;
