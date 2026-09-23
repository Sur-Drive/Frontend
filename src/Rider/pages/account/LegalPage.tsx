import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

type View = "home" | "terms" | "privacy";

const TERMS_BODY = `lorem ipsum dolor sit amet consectetur adipiscing elit soluta pariatur dolores in temporibus quis ut placeat laborum libero accusamus laborum et fugiat vel optio elit id esse aliquip ad cupidatat rerum duis in cupidatat facere qui similique atque sint quo maxime in non facilis quidem facilis amet laborum rerum nulla vero imperdiet id et et eligendi culpa omnis distinctio praesentium dignissimos provident incididunt sint molestias illum cupidatat et dolor deleniti cupidatat dolore omnis ut quo ut id culpa consequatur ut dolorem sunt animi cumque provident imperdiet ad accusamus non facilis voluptatum non consequat nihil dolore ullamco nihil deserunt consequatur sint mollit officia praesentium facilis libero ad possimus nam aut minus atque et autem vero adipiscing ut vel ipsum eligendi nostrud molestias accusamus eligendi vero occaecat dolorem dolore dolorum atque nisi amet animi id accusamus optio ad dolore exercitation facilis ea laboris irure libero ipsum enim ea temporibus cumque qui soluta ullamco est eos anim quo voluptate nulla sunt imperdiet temporibus consequatur est esse elit accusamus ut quo praesentium praesentium cum dolore qui labore et similique non autem laboris esse vel lorem consectetur facere aute id nisi omnis quidem dolor in in quo occaecat nostrud vero ducimus l

aboris aut laborum laboris ad esse ex provident adipiscing facilis mollitia ullamco animi eu excepteur praesentium sed qui sint culpa est fuga est voluptas illum culpa molestias deserunt et tempore et do odio exercitation tempore nostrud irure occaecat mollitia occaecat pariatur amet sunt reprehenderit incididunt culpa optio laborum ducimus veniam aliqua possimus culpa assumenda ut reprehenderit minim sed id sint fuga facere sint minus vel harum consequatur qui deserunt et minus aute voluptate vero consequatur et laborum sunt expedita fugiat fugiat sint ut voluptatum eum amet laboris est esse consequat placeat ut laborum rerum non id nam ut et omnis non mollitia excepturi voluptatum dolorum mollit cumque cupidatat minim mollitia id animi non laborum ipsum quos corrupti nam cillum adipiscing incididunt dolor ut nulla minus ut veniam qui omnis quos accusamus et quo cillum esse omnis laborum possimus mollit`;

const PRIVACY_BODY = `lorem ipsum dolor sit amet consectetur adipiscing elit soluta pariatur dolores in temporibus quis ut placeat laborum libero accusamus laborum et fugiat vel optio elit id esse aliquip ad cupidatat rerum duis in cupidatat facere qui similique atque sint quo maxime in non facilis quidem facilis amet laborum rerum nulla vero imperdiet id et et eligendi culpa omnis distinctio praesentium dignissimos provident incididunt sint molestias illum cupidatat et dolor deleniti cupidatat dolore omnis ut quo ut id culpa consequatur ut dolorem sunt animi cumque provident imperdiet ad accusamus non facilis voluptatum non consequat nihil dolore ullamco nihil deserunt consequatur sint mollit officia praesentium facilis libero ad possimus nam aut minus atque et autem vero adipiscing ut vel ipsum eligendi nostrud molestias accusamus eligendi vero occaecat dolorem dolore dolorum atque nisi amet animi id accusamus optio ad dolore exercitation facilis ea laboris irure libero ipsum enim ea temporibus cumque qui soluta ullamco est eos anim quo voluptate nulla sunt imperdiet temporibus consequatur est esse elit accusamus ut quo praesentium praesentium cum dolore qui labore et similique non autem laboris esse vel lorem consectetur facere aute id nisi omnis quidem dolor in in quo occaecat nostrud vero ducimus l

aboris aut laborum laboris ad esse ex provident adipiscing facilis mollitia ullamco animi eu excepteur praesentium sed qui sint culpa est fuga est voluptas illum culpa molestias deserunt et tempore et do odio exercitation tempore nostrud irure occaecat mollitia occaecat pariatur amet sunt reprehenderit incididunt culpa optio laborum ducimus veniam aliqua possimus culpa assumenda ut reprehenderit minim sed id sint fuga facere sint minus vel harum consequatur qui deserunt et minus aute voluptate vero consequatur et laborum sunt expedita fugiat fugiat sint ut voluptatum eum amet laboris est esse consequat placeat ut laborum rerum non id nam ut et omnis non mollitia excepturi voluptatum dolorum mollit cumque cupidatat minim mollitia id animi non laborum ipsum quos corrupti nam cillum adipiscing incididunt dolor ut nulla minus ut veniam qui omnis quos accusamus et quo cillum esse omnis laborum possimus mollit`;

function LegalDocPage({
  title,
  body,
  onBack,
}: {
  title: string;
  body: string;
  onBack: () => void;
}) {
  const paragraphs = body.split("\n\n");

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-50 shadow-md"
            >
              <ChevronLeft size={22} className="text-[#1F2937]" />
            </button>
            <h1 className="text-[26px] font-extrabold text-[#1F2937]">
              {title}
            </h1>
          </div>

          <h2 className="mt-7 text-[19px] font-bold text-[#1F2937]">
            Introduction
          </h2>

          <div className="mt-3 flex flex-col gap-4">
            {paragraphs.map((paragraph, idx) => (
              <p
                key={idx}
                className="text-[15px] leading-[1.7] text-[#4B5768]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LegalPage({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("home");

  if (view === "terms") {
    return (
      <LegalDocPage
        title="Terms & Conditions"
        body={TERMS_BODY}
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "privacy") {
    return (
      <LegalDocPage
        title="Privacy policy"
        body={PRIVACY_BODY}
        onBack={() => setView("home")}
      />
    );
  }

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[26px] font-extrabold text-[#1F2937]">
            Legals
          </h1>

          <div className="mt-5 divide-y divide-gray-100 rounded-3xl bg-white px-4 shadow-sm">
            <button
              type="button"
              onClick={() => setView("terms")}
              className="flex w-full items-center gap-3.5 py-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <FileText size={18} className="text-[#1F2937]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#1F2937]">
                  Terms &amp; Conditions
                </p>
                <p className="text-[13.5px] text-[#7B87B8]">
                  Read our terms &amp; conditions
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
            </button>

            <button
              type="button"
              onClick={() => setView("privacy")}
              className="flex w-full items-center gap-3.5 py-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2F5]">
                <FileText size={18} className="text-[#1F2937]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#1F2937]">
                  Privacy policy
                </p>
                <p className="text-[13.5px] text-[#7B87B8]">
                  Read our Privacy policy
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
