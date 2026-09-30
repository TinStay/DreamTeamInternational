/**
 * The people on the About page's team section (`components/about-page-view.tsx`), in the order they appear.
 * TODO(content): the names and photos are real; the roles, one-line intros and LinkedIn URLs are still placeholders -
 * put the real ones here (`photo` is a file under `public/team/`; without it the card shows the initials).
 */
export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  linkedin: string;
  photo?: string;
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Stoyan",
    role: "Managing Partner & Creative Director",
    bio: "Leads the creative direction and the client projects at IzI Video, from the first idea to the final cut.",
    linkedin: "https://www.linkedin.com/",
    photo: "/team/stoyan.jpg",
  },
  {
    name: "Martin",
    role: "Managing Partner & Creative Director",
    bio: "Leads the creative direction and the client projects at IzI Video, from the first idea to the final cut.",
    linkedin: "https://www.linkedin.com/",
    photo: "/team/martin.jpg",
  },
  {
    name: "Simeon",
    role: "Managing Partner & Creative Director",
    bio: "Leads the creative direction and the client projects at IzI Video, from the first idea to the final cut.",
    linkedin: "https://www.linkedin.com/",
    photo: "/team/simeon.jpg",
  },
];
