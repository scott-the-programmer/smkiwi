import React from "react";

const timelineData = [
  {
    type: "employment",
    company: "Starshipit",
    logo: "timeline/starshipit.jpeg",
    startDate: "Jan 2024 - Present",
    endDate: "Present",
  },
  {
    type: "project",
    name: "Hackathon Lightspeed 2023",
    startDate: "Feb 2022",
  },
  {
    type: "project",
    name: "Created backstage-plugin-spacelift (Backstage Plugin for Spacelift)",
    startDate: "Aug 2022",
  },
  {
    type: "employment",
    company: "Lightspeed",
    logo: "timeline/lightspeed.jpeg",
    startDate: "Oct 2022 - Jan 2024",
    endDate: "Present",
  },
  {
    type: "project",
    name: "Created terraform-provider-minikube (Terraform Provider for Minikube)",
    startDate: "Aug 2022",
  },
  {
    type: "employment",
    company: "Serko",
    logo: "timeline/serko.jpeg",
    startDate: "Jun 2022",
    endDate: "Oct 2022",
  },
  {
    type: "project",
    name: "Became a dog owner 🐶",
    startDate: "Feb 2022",
  },
  {
    type: "project",
    name: "Hackathon Zip 2022 (2nd place)",
    startDate: "Feb 2022",
  },
  {
    type: "project",
    name: "Zipster of the Year Award",
    startDate: "Feb 2022",
  },
  {
    type: "project",
    name: "Presented at DevOps Auckland (Infrastructure as Code)",
    startDate: "Feb 2022",
  },
  {
    type: "project",
    name: "Created meshed (k8s/istio bootstrapper)",
    startDate: "Feb 2022",
  },
  {
    type: "project",
    name: "Hackathon Zip 2021 (2nd place)",
    startDate: "Feb 2022",
  },
  {
    type: "employment",
    company: "Zip",
    logo: "timeline/zip.jpeg",
    startDate: "Nov 2019",
    endDate: "Jun 2022",
  },
  {
    type: "project",
    name: "Started scott-the-programmer.com",
    startDate: "Feb 2022",
  },
  {
    type: "project",
    name: "Created droid-up (mobile backup utility)",
    startDate: "Feb 2022",
  },
  {
    type: "employment",
    company: "IQVIA",
    logo: "timeline/iqvia.jpeg",
    startDate: "Jan 2016",
    endDate: "Nov 2019",
  },
  {
    type: "employment",
    company: "DXC",
    logo: "timeline/dxc.jpeg",
    startDate: "Apr 2015",
    endDate: "Dec 2015",
  },
  {
    type: "employment",
    company: "The University of Auckland",
    logo: "timeline/au.jpeg",
    startDate: "Feb 2014",
    endDate: "Feb 2015",
    description: "Scholarship Student, Teaching Assistant",
  },
  {
    type: "project",
    name: "Student Construct 2 Bootcamp",
    startDate: "Jan 2013",
    endDate: "Dec 2013",
  },
  {
    type: "project",
    name: "Microsoft Student Bootcamp",
    startDate: "Jan 2012",
  },
];

function renderNameWithItalicText(name?: string) {
  if (name === undefined) {
    return <></>;
  }
  const emojiRegex = /(\p{Emoji_Presentation})/u;
  return name
    .split(emojiRegex)
    .map((part, index) =>
      emojiRegex.test(part) ? (
        <span key={index}>{part}</span>
      ) : (
        <i key={index}>{part}</i>
      ),
    );
}

const Timeline: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-full">
      {timelineData.map((item, index) => (
        <div key={index} className="flex flex-col items-center w-full">
          {item.type === "employment" && (
            <div className="timeline-item relative w-48 flex flex-col items-center my-4 p-4 rounded-xl bg-gray-200 shadow-md opacity-80">
              <div className="timeline-logo">
                <img
                  src={item.logo}
                  alt={item.company}
                  className="w-16 h-16 object-contain rounded-full"
                />
              </div>
              <div className="timeline-content text-center mt-2">
                <h3 className="text-lg font-semibold">{item.company}</h3>
                <p className="text-gray-600">
                  {item.startDate} - {item.endDate}
                </p>
              </div>
            </div>
          )}

          {item.type === "project" && (
            <div className="project flex items-center h-4 my-2 w-full justify-center relative">
              <div className="line w-1 h-4 bg-gray-600 absolute"></div>
              <div
                className={`text-sm text-gray-700 absolute w-1/2 ${
                  index % 2 === 0
                    ? "right-1/2 text-right pr-4"
                    : "left-1/2 text-left pl-4"
                }`}
              >
                {renderNameWithItalicText(item.name)}
              </div>
            </div>
          )}
          <div className="stem w-1 h-4 bg-gray-600 my-2 mx-auto opacity-60"></div>
        </div>
      ))}
    </div>
  );
};
export default Timeline;
