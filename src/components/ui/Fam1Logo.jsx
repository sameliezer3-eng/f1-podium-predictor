import { useId } from 'react'

// Final, approved "Fam1" mark — implemented as given, not a starting point
// for further iteration. Every letter is a real vector path outline
// (extracted from Liberation Sans Bold) referenced via <use>, not live
// <text> — renders identically everywhere regardless of installed fonts.
// Background is intentionally transparent: this sits directly on whatever
// dark surface it's placed on (header, splash, podium) rather than carrying
// its own backdrop. viewBox is the source design's native 680×380 canvas;
// scale via `size` (sets the rendered height, width follows the aspect
// ratio) or `className` rather than baking in one fixed size.
//
// `id`s inside (pF/pa/pm/p1, the gradients, the shadow filter) are
// namespaced per-instance via useId(). The raw markup this was built from
// hardcodes those ids, which is fine for a single copy in a static file but
// breaks the moment two instances are mounted at once — e.g. the header's
// logo and the podium watermark are both on-screen simultaneously on the
// Scoreboard page, and `<use href="#pF">` resolves against the whole
// document, not scoped per <svg>, so unnamespaced ids from two instances
// would collide. Purely a correctness fix — the visible artwork is untouched.
export default function Fam1Logo({ size, className = '', title = 'Fam1' }) {
  const uid = useId()
  const id = (name) => `${uid}-${name}`

  return (
    <svg
      viewBox="0 0 680 380"
      width={size}
      height={size ? size * (380 / 680) : undefined}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <path id={id('pF')} d="M432 1181V745H1153V517H432V0H137V1409H1176V1181Z" />
        <path id={id('pa')} d="M393 -20Q236 -20 148.0 65.5Q60 151 60 306Q60 474 169.5 562.0Q279 650 487 652L720 656V711Q720 817 683.0 868.5Q646 920 562 920Q484 920 447.5 884.5Q411 849 402 767L109 781Q136 939 253.5 1020.5Q371 1102 574 1102Q779 1102 890.0 1001.0Q1001 900 1001 714V320Q1001 229 1021.5 194.5Q1042 160 1090 160Q1122 160 1152 166V14Q1127 8 1107.0 3.0Q1087 -2 1067.0 -5.0Q1047 -8 1024.5 -10.0Q1002 -12 972 -12Q866 -12 815.5 40.0Q765 92 755 193H749Q631 -20 393 -20ZM720 501 576 499Q478 495 437.0 477.5Q396 460 374.5 424.0Q353 388 353 328Q353 251 388.5 213.5Q424 176 483 176Q549 176 603.5 212.0Q658 248 689.0 311.5Q720 375 720 446Z" />
        <path id={id('pm')} d="M780 0V607Q780 892 616 892Q531 892 477.5 805.0Q424 718 424 580V0H143V840Q143 927 140.5 982.5Q138 1038 135 1082H403Q406 1063 411.0 980.5Q416 898 416 867H420Q472 991 549.5 1047.0Q627 1103 735 1103Q983 1103 1036 867H1042Q1097 993 1174.0 1048.0Q1251 1103 1370 1103Q1528 1103 1611.0 995.5Q1694 888 1694 687V0H1415V607Q1415 892 1251 892Q1169 892 1116.5 812.5Q1064 733 1059 593V0Z" />
        <path id={id('p1')} d="M129 0V209H478V1170L140 959V1180L493 1409H759V209H1082V0Z" />
        <linearGradient id={id('whiteGrad')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c7c7c2" />
        </linearGradient>
        <linearGradient id={id('redGrad')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF1801" />
          <stop offset="100%" stopColor="#A81200" />
        </linearGradient>
        <filter id={id('shadowBlur')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <g transform="translate(0,205) scale(1.15,0.82) translate(0,-205) skewX(-24)">
        <g filter={`url(#${id('shadowBlur')})`} opacity="0.55">
          <use href={`#${id('pF')}`} transform="translate(115,219) scale(0.1123046875,-0.1123046875)" fill="#000000" />
          <use href={`#${id('pa')}`} transform="translate(170,219) scale(0.05615234375,-0.05615234375)" fill="#000000" />
          <use href={`#${id('pm')}`} transform="translate(235,219) scale(0.05615234375,-0.05615234375)" fill="#000000" />
          <use href={`#${id('p1')}`} transform="translate(285,219) scale(0.1123046875,-0.1123046875)" fill="#000000" />
        </g>

        <use href={`#${id('pa')}`} transform="translate(167,212) scale(0.05615234375,-0.05615234375)" fill="#2b2b29" />
        <use href={`#${id('pa')}`} transform="translate(165.6,210.6) scale(0.05615234375,-0.05615234375)" fill="#333331" />
        <use href={`#${id('pa')}`} transform="translate(164.2,209.2) scale(0.05615234375,-0.05615234375)" fill="#3d3d3a" />
        <use href={`#${id('pa')}`} transform="translate(162.8,207.8) scale(0.05615234375,-0.05615234375)" fill="#484845" />
        <use href={`#${id('pa')}`} transform="translate(161.4,206.4) scale(0.05615234375,-0.05615234375)" fill="#54544f" />
        <use href={`#${id('pa')}`} transform="translate(160,205) scale(0.05615234375,-0.05615234375)" fill={`url(#${id('whiteGrad')})`} />

        <use href={`#${id('pF')}`} transform="translate(112,212) scale(0.1123046875,-0.1123046875)" fill="#2b2b29" />
        <use href={`#${id('pF')}`} transform="translate(110.6,210.6) scale(0.1123046875,-0.1123046875)" fill="#333331" />
        <use href={`#${id('pF')}`} transform="translate(109.2,209.2) scale(0.1123046875,-0.1123046875)" fill="#3d3d3a" />
        <use href={`#${id('pF')}`} transform="translate(107.8,207.8) scale(0.1123046875,-0.1123046875)" fill="#484845" />
        <use href={`#${id('pF')}`} transform="translate(106.4,206.4) scale(0.1123046875,-0.1123046875)" fill="#54544f" />
        <use href={`#${id('pF')}`} transform="translate(105,205) scale(0.1123046875,-0.1123046875)" fill={`url(#${id('whiteGrad')})`} />

        <use href={`#${id('pm')}`} transform="translate(232,212) scale(0.05615234375,-0.05615234375)" fill="#2b2b29" />
        <use href={`#${id('pm')}`} transform="translate(230.6,210.6) scale(0.05615234375,-0.05615234375)" fill="#333331" />
        <use href={`#${id('pm')}`} transform="translate(229.2,209.2) scale(0.05615234375,-0.05615234375)" fill="#3d3d3a" />
        <use href={`#${id('pm')}`} transform="translate(227.8,207.8) scale(0.05615234375,-0.05615234375)" fill="#484845" />
        <use href={`#${id('pm')}`} transform="translate(226.4,206.4) scale(0.05615234375,-0.05615234375)" fill="#54544f" />
        <use href={`#${id('pm')}`} transform="translate(225,205) scale(0.05615234375,-0.05615234375)" fill={`url(#${id('whiteGrad')})`} />

        <use href={`#${id('p1')}`} transform="translate(282,212) scale(0.1123046875,-0.1123046875)" fill="#3d0a02" />
        <use href={`#${id('p1')}`} transform="translate(280.6,210.6) scale(0.1123046875,-0.1123046875)" fill="#4d0c03" />
        <use href={`#${id('p1')}`} transform="translate(279.2,209.2) scale(0.1123046875,-0.1123046875)" fill="#5e0f04" />
        <use href={`#${id('p1')}`} transform="translate(277.8,207.8) scale(0.1123046875,-0.1123046875)" fill="#711206" />
        <use href={`#${id('p1')}`} transform="translate(276.4,206.4) scale(0.1123046875,-0.1123046875)" fill="#861508" />
        <use href={`#${id('p1')}`} transform="translate(275,205) scale(0.1123046875,-0.1123046875)" fill={`url(#${id('redGrad')})`} />
      </g>
    </svg>
  )
}

// Flattened, high-contrast variant for anywhere the full mark won't hold up:
// mobile nav, other tiny in-app contexts. Same letter paths, positions, and
// skew as the full mark, but the drop-shadow blur and the 5-layer
// offset-bevel stack per letter are gone — those are what go muddy once the
// artwork is scaled down to a handful of pixels, since the 1.4–7px offsets
// between bevel layers become sub-pixel and just blur together. One flat
// fill per letter instead: white for "Fam", solid red for "1". Also
// transparent — same "sits on the surrounding surface" rule as the full mark.
export function Fam1LogoSimple({ size, className = '', title = 'Fam1' }) {
  const uid = useId()
  const id = (name) => `${uid}-simple-${name}`

  return (
    <svg
      viewBox="0 0 680 380"
      width={size}
      height={size ? size * (380 / 680) : undefined}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <path id={id('pF')} d="M432 1181V745H1153V517H432V0H137V1409H1176V1181Z" />
        <path id={id('pa')} d="M393 -20Q236 -20 148.0 65.5Q60 151 60 306Q60 474 169.5 562.0Q279 650 487 652L720 656V711Q720 817 683.0 868.5Q646 920 562 920Q484 920 447.5 884.5Q411 849 402 767L109 781Q136 939 253.5 1020.5Q371 1102 574 1102Q779 1102 890.0 1001.0Q1001 900 1001 714V320Q1001 229 1021.5 194.5Q1042 160 1090 160Q1122 160 1152 166V14Q1127 8 1107.0 3.0Q1087 -2 1067.0 -5.0Q1047 -8 1024.5 -10.0Q1002 -12 972 -12Q866 -12 815.5 40.0Q765 92 755 193H749Q631 -20 393 -20ZM720 501 576 499Q478 495 437.0 477.5Q396 460 374.5 424.0Q353 388 353 328Q353 251 388.5 213.5Q424 176 483 176Q549 176 603.5 212.0Q658 248 689.0 311.5Q720 375 720 446Z" />
        <path id={id('pm')} d="M780 0V607Q780 892 616 892Q531 892 477.5 805.0Q424 718 424 580V0H143V840Q143 927 140.5 982.5Q138 1038 135 1082H403Q406 1063 411.0 980.5Q416 898 416 867H420Q472 991 549.5 1047.0Q627 1103 735 1103Q983 1103 1036 867H1042Q1097 993 1174.0 1048.0Q1251 1103 1370 1103Q1528 1103 1611.0 995.5Q1694 888 1694 687V0H1415V607Q1415 892 1251 892Q1169 892 1116.5 812.5Q1064 733 1059 593V0Z" />
        <path id={id('p1')} d="M129 0V209H478V1170L140 959V1180L493 1409H759V209H1082V0Z" />
      </defs>
      <g transform="translate(0,205) scale(1.15,0.82) translate(0,-205) skewX(-24)">
        <use href={`#${id('pF')}`} transform="translate(105,205) scale(0.1123046875,-0.1123046875)" fill="#ffffff" />
        <use href={`#${id('pa')}`} transform="translate(160,205) scale(0.05615234375,-0.05615234375)" fill="#ffffff" />
        <use href={`#${id('pm')}`} transform="translate(225,205) scale(0.05615234375,-0.05615234375)" fill="#ffffff" />
        <use href={`#${id('p1')}`} transform="translate(275,205) scale(0.1123046875,-0.1123046875)" fill="#FF1801" />
      </g>
    </svg>
  )
}
