import LegalDocument from "../../../components/passenger/account/LegalDocument";

import {
  legalParagraphOne,
  legalParagraphTwo,
} from "../../../data/legalContent";

export default function TermsConditions() {
  return (
    <LegalDocument title="Terms & Conditions">
      <article>
        <h1 className="text-[17px] font-semibold text-[#302B34]">
          Introduction
        </h1>

        <div className="mt-4 space-y-6 text-[14px] leading-[1.75] text-[#4F4953]">
          <p>
            {legalParagraphOne}
          </p>

          <p>
            {legalParagraphTwo}
          </p>
        </div>
      </article>
    </LegalDocument>
  );
}