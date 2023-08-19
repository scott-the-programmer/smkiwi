import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SkillGraph: React.FC = () => {
  const data = [
    { name: "Terraform", proficiency: 10 },
    { name: "Pulumi", proficiency: 10 },
    { name: ".NET", proficiency: 9 },
    { name: "Golang", proficiency: 8 },
    { name: "JS/TS", proficiency: 8 },
    { name: "Python", proficiency: 6 },
    { name: "Flutter", proficiency: 5 },
  ];

  return (
    <div data-testid="skill-graph">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 40,
            bottom: 50,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 10]} tickCount={3} />
          <YAxis dataKey="name" type="category" />
          <Bar dataKey="proficiency" fill="#142f6e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillGraph;
