// import React from "react";
// import { ChevronLeft } from "lucide-react";

// const TermsPrivacyPage: React.FC = () => {
//   return (
//     <div className="min-h-screen bg-white">
//       <div className="max-w-md px-8 mx-auto">
//         {/* Back button */}
//         <div className="pt-10 pb-6">
//           <button
//             type="button"
//             aria-label="Go back"
//             className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2b0f3a] text-white"
//           >
//             <ChevronLeft size={22} strokeWidth={2.5} />
//           </button>
//         </div>

//         {/* Page title */}
//         <h1 className="text-[2.1rem] font-extrabold leading-tight text-[#161221]">
//           Terms &amp; privacy
//         </h1>

//         {/* Introduction */}
//         <h2 className="mt-9 text-[2.4rem] font-extrabold leading-tight text-[#161221]">
//           Introduction
//         </h2>

//         <p className="mt-5 text-[1.35rem] leading-[1.85rem] text-[#3d3750]">
//           Lorem Ipsum is simply dummy text of the printing and typesetting
//           industry. Lorem Ipsum has been the industry&rsquo;s standard dummy
//           text ever since 1966, when designers at Letraset and James Mosley, the
//           librarian at St Bride Printing Library in London, took a 1914 Cicero
//           translation and scrambled it to make dummy text for Letraset&rsquo;s
//           Body Type sheets. It has survived not only many decades, but also the
//           leap into electronic typesetting, remaining essentially unchanged. It
//           was popularised thanks to these sheets and more recently with desktop
//           publishing software including versions of Lorem Ipsum.
//         </p>

//         {/* Subheading */}
//         <h3 className="mt-10 text-[1.6rem] font-bold text-[#161221]">
//           Where does it come from?
//         </h3>

//         <p className="mt-5 pb-12 text-[1.35rem] leading-[1.85rem] text-[#3d3750]">
//           Contrary to popular belief, Lorem Ipsum is not simply random text. It
//           has roots in a piece of classical Latin literature from 45 BC, making
//           it over 2000 years old. Richard McClintock, a Latin professor at
//           Hampden&ndash;Sydney College in Virginia, looked up one of the more
//           obscure Latin words, consectetur, from a Lorem Ipsum passage, and
//           going through the cites of the word in classical literature,
//           discovered the undoubtable source. Lorem Ipsum comes from sections
//           1.10.32 and
//         </p>
//       </div>
//     </div>
//   );
// };

// export default TermsPrivacyPage;

import React from "react";
import { ChevronLeft } from "lucide-react";

const TermsPrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md px-5 mx-auto sm:max-w-lg sm:px-8 md:max-w-xl lg:max-w-2xl">
        {/* Back button */}
        <div className="pt-6 pb-4 sm:pt-10 sm:pb-6">
          <button
            type="button"
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b0f3a] text-white sm:h-12 sm:w-12"
          >
            <ChevronLeft size={18} strokeWidth={2.5} className="sm:hidden" />
            <ChevronLeft
              size={22}
              strokeWidth={2.5}
              className="hidden sm:block"
            />
          </button>
        </div>

        {/* Page title */}
        <h1 className="text-xl font-extrabold leading-tight text-[#161221] sm:text-2xl md:text-3xl">
          Terms &amp; privacy
        </h1>

        {/* Introduction */}
        <h2 className="mt-6 text-2xl font-extrabold leading-tight text-[#161221] sm:mt-9 sm:text-3xl md:text-4xl">
          Introduction
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#3d3750] sm:mt-5 sm:text-base md:text-lg">
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry&rsquo;s standard dummy
          text ever since 1966, when designers at Letraset and James Mosley, the
          librarian at St Bride Printing Library in London, took a 1914 Cicero
          translation and scrambled it to make dummy text for Letraset&rsquo;s
          Body Type sheets. It has survived not only many decades, but also the
          leap into electronic typesetting, remaining essentially unchanged. It
          was popularised thanks to these sheets and more recently with desktop
          publishing software including versions of Lorem Ipsum.
        </p>

        {/* Subheading */}
        <h3 className="mt-6 text-base font-bold text-[#161221] sm:mt-10 sm:text-xl md:text-2xl">
          Where does it come from?
        </h3>

        <p className="mt-3 pb-8 text-sm leading-relaxed text-[#3d3750] sm:mt-5 sm:pb-12 sm:text-base md:text-lg">
          Contrary to popular belief, Lorem Ipsum is not simply random text. It
          has roots in a piece of classical Latin literature from 45 BC, making
          it over 2000 years old. Richard McClintock, a Latin professor at
          Hampden&ndash;Sydney College in Virginia, looked up one of the more
          obscure Latin words, consectetur, from a Lorem Ipsum passage, and
          going through the cites of the word in classical literature,
          discovered the undoubtable source. Lorem Ipsum comes from sections
          1.10.32 and
        </p>
      </div>
    </div>
  );
};

export default TermsPrivacyPage;
