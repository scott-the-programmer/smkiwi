import React, { useState } from "react";
import Toggle from "react-toggle";
import "react-toggle/style.css";
import SkillGraph from "./SkillGraph";
import BubbleSkillGraph from "./BubbleSkillGraph";
import "./GraphToggle.css";

const GraphToggle: React.FC = () => {
  const [isBubbleView, setIsBubbleView] = useState(true);

  const toggleView = () => {
    setIsBubbleView(!isBubbleView);
  };

  return (
    <div style={{ textAlign: "center" }}>
      {isBubbleView ? <BubbleSkillGraph /> : <SkillGraph />}
      <div style={{ display: "inline-block", marginTop: "5px" }}>
        <Toggle
          className="react-toggle"
          data-testid="react-toggle"
          checked={isBubbleView}
          onChange={toggleView}
          icons={true}
        />
      </div>
    </div>
  );
};

export default GraphToggle;
