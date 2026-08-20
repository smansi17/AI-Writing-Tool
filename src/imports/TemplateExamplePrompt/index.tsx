import svgPaths from "./svg-3w8oipoqj8";

function Group() {
  return (
    <div className="absolute inset-[12.5%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" height="13.5" preserveAspectRatio="none" viewBox="0 0 13.5 13.5" width="13.5">
        <g id="Group">
          <g id="Group_2">
            <path d={svgPaths.p3236b380} fill="black" id="Vector" />
          </g>
          <path d={svgPaths.p28c0aff0} fill="black" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Article() {
  return (
    <div className="overflow-clip relative shrink-0 size-[18px]" data-name="Article">
      <Group />
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute bg-[#ecf6ff] content-stretch flex h-[34px] items-center justify-center left-0 px-[14px] py-[3px] rounded-[6px] top-0 w-[35px]">
      <div aria-hidden className="absolute border border-[#3581c4] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <Article />
    </div>
  );
}

function Pause() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Pause">
      <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 15 15" width="15">
        <g clipPath="url(#clip0_0_7)" id="Pause">
          <g id="Vector" />
          <path d={svgPaths.p3078c980} fill="black" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_0_7">
            <rect fill="white" height="15" width="15" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[2px] h-[34px] items-center justify-center left-[337px] px-[14px] py-[6px] rounded-[6px] top-0 w-[197px]">
      <div aria-hidden className="absolute border-[#3581c4] border-[0.6px] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <Pause />
      <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[30px] not-italic relative shrink-0 text-[16px] text-black whitespace-nowrap">Pause suggestions</p>
    </div>
  );
}

function ContentCopy() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Content copy">
      <svg className="absolute block inset-0 size-full" fill="none" height="18" preserveAspectRatio="none" viewBox="0 0 18 18" width="18">
        <g clipPath="url(#clip0_0_4)" id="Content copy">
          <g id="Vector" />
          <path d={svgPaths.p30afe100} fill="black" id="Vector_2" />
        </g>
        <defs>
          <clipPath id="clip0_0_4">
            <rect fill="white" height="18" width="18" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-white content-stretch flex h-[34px] items-center justify-center px-[14px] py-[6px] relative rounded-[6px] shrink-0 w-[35px]">
      <div aria-hidden className="absolute border-[#3581c4] border-[0.6px] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <ContentCopy />
    </div>
  );
}

function Frame() {
  return (
    <div className="bg-[#2990ea] content-stretch flex h-[34px] items-center justify-center px-[14px] py-[6px] relative rounded-[6px] shrink-0 w-[105px]">
      <div aria-hidden className="absolute border-[#3581c4] border-[0.6px] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[30px] not-italic relative shrink-0 text-[16px] text-white whitespace-nowrap">Download</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="absolute content-stretch flex gap-[13px] items-center left-[718px] top-0">
      <Frame2 />
      <Frame />
    </div>
  );
}

function Frame7() {
  return (
    <div className="h-[34px] relative shrink-0 w-full">
      <Frame3 />
      <Frame1 />
      <Frame6 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-white border border-[#b8b8b8] border-solid content-stretch flex flex-col h-[1140px] items-start p-[100px] relative rounded-[5px] shrink-0 w-full">
      <p className="[word-break:break-word] font-['Inter:Italic',sans-serif] font-normal italic leading-[0] relative shrink-0 text-[#b2b2b2] text-[0px] w-full">
        <span className="leading-[30px] text-[#5f5f5f] text-[16px]">|</span>
        <span className="leading-[30px] text-[16px]">Begin typing here to get AI Suggestions on your writing</span>
        <span className="leading-[30px] text-[16px]">{` `}</span>
      </p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] items-start left-[361px] top-[162px] w-[871px]">
      <Frame7 />
      <Frame5 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="bg-white border border-[#b8b8b8] border-solid content-stretch flex h-[222px] items-start p-[20px] relative rounded-[5px] shrink-0 w-full">
      <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Italic',sans-serif] font-normal h-full italic leading-[26px] min-w-px relative text-[#5f5f5f] text-[16px]">A reflection essay on the book ‘Emma’ by Jane Austen, critically analyzing the themes and story.</p>
    </div>
  );
}

function Frame4() {
  return (
    <a className="bg-white content-stretch cursor-pointer flex h-[28px] items-center justify-center px-[14px] py-[3px] relative rounded-[6px] shrink-0">
      <div aria-hidden className="absolute border-[#3581c4] border-[0.6px] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[30px] not-italic relative shrink-0 text-[14px] text-black text-left whitespace-nowrap">Get a Template</p>
    </a>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
      <Frame4 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[13px] items-start left-[43px] top-[166px] w-[298px]">
      <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[30px] not-italic relative shrink-0 text-[16px] text-black w-full">Get a template to kickstart writing</p>
      <Frame10 />
      <Frame9 />
    </div>
  );
}

export default function TemplateExamplePrompt() {
  return (
    <div className="bg-[#f7f7f7] relative size-full" data-name="Template - example prompt">
      <p className="[word-break:break-word] absolute font-['Inter:Bold',sans-serif] font-bold leading-[30px] left-[304px] not-italic text-[26px] text-black top-[92px] w-[231px]">{`Writing Assistant `}</p>
      <Frame8 />
      <Frame11 />
    </div>
  );
}