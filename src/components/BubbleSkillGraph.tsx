import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const BubbleSkillGraph: React.FC = () => {
  const [width, setWidth] = useState(window.innerWidth);
  const height = 350;
  let radiusCoefficient = 1;

  if (width < 1024) {
    radiusCoefficient = 0.7;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = [
    { name: "Terraform", value: 10, x: width * 0.26, y: height * 0.28 },
    { name: "AWS", value: 8, x: width * 0.35, y: height * 0.52 },
    { name: "Pulumi", value: 10, x: width * 0.55, y: height * 0.47 },
    { name: "Azure", value: 8, x: width * 0.50, y: height * 0.19 },
    { name: ".NET", value: 9, x: width * 0.8, y: height * 0.57 },
    { name: "Golang", value: 8, x: width * 0.74, y: height * 0.28 },
    { name: "Typescript", value: 8, x: width * 0.2, y: height * 0.74 },
    { name: "Flutter", value: 5, x: width * 0.53, y: height * 0.78 },
    { name: "Kafka", value: 7, x: width * 0.67, y: height * 0.71 },
  ];

  const ref = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const svg = d3.select(ref.current);

    svg.selectAll("*").remove();

    data.forEach((d) => {
      const radius = ((d.value * 10) / 2) * radiusCoefficient;
      svg
        .append("circle")
        .attr("cx", d.x)
        .attr("cy", d.y)
        .attr("r", radius)
        .attr("fill", "#142f6e")
        .attr("stroke", "#142f6e");

      svg
        .append("text")
        .attr("x", d.x)
        .attr("y", d.y + radius + 10)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("font-size", `${d.value + 5}px`)
        .text(d.name);
    });
  }, [data, radiusCoefficient]);

  return (
    <svg
      className="relative m-auto"
      data-testid="bubble-skill-graph"
      ref={ref}
      width="100vw"
      height={height}
    ></svg>
  );
};

export default BubbleSkillGraph;
