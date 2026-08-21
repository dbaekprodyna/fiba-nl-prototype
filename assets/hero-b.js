/* ============================================================
   FIBA 3x3 Nations League — hero-b.js
   Hero B: cut-out chevrons gathered over the photo, spreading
   left and right to open it, holding while the paint runs, then
   closing back over the centre as the next photo swaps in.

   The chevrons and the paint runs are the artwork from
   Hero B.svg, not shapes generated here — see PIECES below.
   Nothing runs until hero-switch.js broadcasts hero:change with
   mode "b".
   ============================================================ */
(function () {
  'use strict';

  var CFG = {
    photoW:  455,     /* the artwork is drawn around a window this
                         wide — the pieces are not scaled, so this
                         is fixed at every viewport               */
    spread:  1.80,    /* s — pieces travel out, photo opens        */
    hold:    5.00,    /* s — photo held, paint runs                */
    gather:  0.50,    /* s — pieces close back over the centre     */
    pause:   0.12,    /* s — covered; the photo swaps here         */
    speed:   1.00,
    drift:   3.2,     /* px of idle sway during the hold           */
    tilt:    0.40,    /* deg of idle rotation, per piece           */
    fps:     12,      /* the idle sway is stepped to this rate —
                         the cut-out read comes from pieces that
                         move in frames, not in a smooth glide     */
    zoom:    1.05
  };

  var PHOTOS = [
    'assets/hero-b/hero-b-1.jpg?v=1', 'assets/hero-b/hero-b-2.jpg?v=1',
    'assets/hero-b/hero-b-3.jpg?v=1', 'assets/hero-b/hero-b-4.jpg?v=1',
    'assets/hero-b/hero-b-5.jpg?v=1', 'assets/hero-b/hero-b-6.jpg?v=1',
    'assets/hero-b/hero-b-7.jpg?v=1'
  ];

  /* Chevrons lifted straight out of Hero B.svg, sorted left to right,
     x re-based so 0 is the photo window's left edge (the window is
     455 wide). c: b=blue w=white y=yellow r=red. */
  var PIECES = [
    {c:'b',x0:-181.6,x1:-99.3,d:'M-181.6 259.3C-181.2 259.8 -180.8 260.2 -180.4 260.7C-175.8 256.5 -171.3 252.3 -166.7 248.2C-145 228.3 -123.3 208.4 -101.6 188.5L-100.6 187.6L-101.4 186.6C-123.2 160.2 -144.9 133.8 -166.6 107.3L-166.7 109.8C-144.8 88.7 -122.9 67.7 -101 46.6L-99.3 45L-101 43.4C-113.4 31.7 -125.9 20 -138.3 8.4C-142.8 4.1 -147.3 -0.1 -151.8 -4.3C-152.9 -3.1 -154.1 -1.9 -155.2 -0.7C-150.7 3.5 -146.1 7.7 -141.6 11.9C-129.1 23.5 -116.5 35 -104 46.6L-104 43.4C-125.8 64.7 -147.5 85.9 -169.3 107.2L-170.5 108.4L-169.4 109.7C-147.5 135.9 -125.5 162.1 -103.6 188.4L-103.4 186.5C-125 206.6 -146.5 226.6 -168.1 246.7C-172.6 250.9 -177.1 255.1 -181.6 259.3Z'},
    {c:'b',x0:-129.3,x1:-36.5,d:'M-129.3 261.3C-126.4 263.8 -123.6 266.2 -120.7 268.7C-116.9 264.4 -113 260.2 -109.1 255.9C-88.2 233 -67.4 210.1 -46.5 187.1L-42.3 182.6L-45.7 176.9C-61.2 150.9 -76.7 125 -92.1 99.1L-92.8 111.9C-76.1 92.2 -59.4 72.5 -42.7 52.8L-36.5 45.5L-42.2 36.9C-51.2 23.3 -60.2 9.8 -69.2 -3.8C-72.4 -8.6 -75.6 -13.3 -78.7 -18.1C-86.9 -12.4 -95.1 -6.6 -103.3 -0.9C-99.8 3.7 -96.4 8.3 -93 12.9C-83.2 26 -73.5 39 -63.8 52.1L-63.3 36.2C-78.9 56.8 -94.5 77.5 -110.2 98.1L-115.1 104.6L-110.9 110.9C-94 136 -77.1 161.1 -60.3 186.1L-59.5 175.9C-79.1 199.9 -98.8 223.9 -118.4 248C-122 252.4 -125.6 256.9 -129.3 261.3Z'},
    {c:'b',x0:-70.8,x1:-12.5,d:'M-70.8 257.5C-70.3 257.8 -69.7 258.2 -69.2 258.5C-66.5 254.3 -63.8 250.1 -61.1 245.9C-47.1 224.4 -33.2 202.8 -19.3 181.3L-18.9 180.6L-19.2 179.9C-31.3 155.3 -43.3 130.7 -55.3 106.2L-55.5 108C-41.4 87.6 -27.3 67.2 -13.2 46.8L-12.5 45.9L-12.9 44.8C-16.6 33.2 -20.3 21.6 -24 10C-25.6 5.2 -27.1 0.5 -28.6 -4.3C-30.2 -3.8 -31.8 -3.2 -33.4 -2.7C-31.8 2 -30.2 6.8 -28.6 11.5C-24.8 23.1 -21 34.6 -17.1 46.2L-16.8 44.2C-30.7 64.8 -44.6 85.4 -58.5 106L-59.1 106.9L-58.7 107.8C-46.4 132.3 -34.1 156.7 -21.8 181.1L-21.7 179.7C-35.4 201.4 -49.1 223.1 -62.8 244.8C-65.5 249 -68.1 253.3 -70.8 257.5Z'},
    {c:'w',x0:-56.3,x1:-1.6,d:'M-56.3 256.3C-54.1 257.4 -51.9 258.6 -49.7 259.7C-47.4 255.5 -45.1 251.4 -42.9 247.2C-31.4 226 -19.9 204.8 -8.5 183.6L-7.3 181.4L-8.2 178.9C-17.5 153.7 -26.8 128.5 -36.1 103.3L-36.5 109.5C-25.3 89.7 -14.2 70 -3.1 50.2L-1.6 47.5L-2.3 44.1C-4.5 32.5 -6.8 20.9 -9 9.4C-9.9 4.7 -10.8 0 -11.7 -4.6C-18.2 -3.2 -24.8 -1.8 -31.3 -0.4C-30.2 4.2 -29.1 8.8 -28 13.5C-25.2 24.9 -22.5 36.4 -19.7 47.9L-18.9 41.8C-29.1 62 -39.3 82.3 -49.5 102.5L-51.2 105.7L-49.9 108.7C-39.5 133.5 -29.1 158.3 -18.8 183.1L-18.5 178.4C-29.1 200.1 -39.6 221.8 -50.1 243.5C-52.2 247.7 -54.3 252 -56.3 256.3Z'},
    {c:'b',x0:-50.6,x1:7.1,d:'M-50.6 261.6C-49.5 262.2 -48.5 262.8 -47.4 263.4C-44.9 259.2 -42.5 254.9 -40.1 250.7C-27.2 228.3 -14.4 205.8 -1.5 183.4L-0.9 182.3L-1.3 181C-10.2 156.7 -19.1 132.5 -28.1 108.2L-28.3 111.3C-16.7 90.9 -5.2 70.5 6.4 50.1L7.1 48.8L6.9 47.2C4.7 34.6 2.5 22.1 0.4 9.5C-0.4 4.7 -1.3 -0.1 -2.1 -4.9C-5.4 -4.3 -8.6 -3.7 -11.9 -3.1C-11 1.7 -10.1 6.5 -9.1 11.3C-6.7 23.8 -4.3 36.3 -1.9 48.8L-1.4 45.9C-12.5 66.5 -23.6 87.1 -34.7 107.7L-35.6 109.3L-34.9 110.8C-25.5 134.9 -16.1 158.9 -6.7 183L-6.5 180.6C-18.9 203.3 -31.2 226 -43.6 248.7C-46 253 -48.3 257.3 -50.6 261.6Z'},
    {c:'r',x0:-47.8,x1:11.3,d:'M-47.8 263.5C-47.3 263.8 -46.7 264.2 -46.2 264.5C-43.7 260.2 -41.3 256 -38.8 251.7C-25.5 228.7 -12.1 205.7 1.2 182.7L1.6 182.1L1.4 181.5C-7.2 157.3 -15.7 133.1 -24.3 108.9L-24.4 110.4C-12.6 90.3 -0.9 70.2 10.9 50.1L11.3 49.4L11.2 48.6C9.2 36.1 7.2 23.6 5.3 11.1C4.5 6.3 3.7 1.4 3 -3.4C1.3 -3.1 -0.3 -2.9 -2 -2.6C-1.1 2.2 -0.3 7.1 0.5 11.9C2.6 24.4 4.7 36.9 6.8 49.4L7.1 47.9C-4.5 68.1 -16 88.3 -27.6 108.6L-28 109.3L-27.7 110.1C-18.9 134.2 -10.1 158.4 -1.4 182.5L-1.2 181.3C-14.4 204.4 -27.5 227.6 -40.6 250.7C-43 255 -45.4 259.3 -47.8 263.5Z'},
    {c:'y',x0:-44.9,x1:24.4,d:'M-44.9 261.1C-43.3 262 -41.7 263 -40.1 263.9C-37.5 259.8 -34.9 255.6 -32.3 251.5C-18.5 229.2 -4.6 207 9.2 184.7L10.2 183.1L9.6 181.1C2 156.9 -5.6 132.6 -13.3 108.3L-13.8 112.9C-1.5 93.4 10.8 73.9 23.2 54.5L24.4 52.5L24.1 50C22.3 36.8 20.6 23.6 18.8 10.4C18.2 5.6 17.6 0.7 16.9 -4.1C12 -3.4 7 -2.6 2.1 -1.9C2.9 2.9 3.7 7.7 4.5 12.6C6.6 25.7 8.8 38.8 10.9 52L11.8 47.5C0.2 67.4 -11.5 87.3 -23.2 107.1L-24.6 109.4L-23.7 111.7C-15.4 135.8 -7 159.8 1.4 183.9L1.8 180.3C-11.3 203 -24.4 225.7 -37.6 248.4C-40 252.6 -42.5 256.8 -44.9 261.1Z'},
    {c:'w',x0:-37.6,x1:31.5,d:'M-37.6 260.5C-36.5 261.2 -35.5 261.8 -34.4 262.5C-31.8 258.4 -29.1 254.3 -26.5 250.1C-12.5 228.4 1.5 206.7 15.4 185L16.1 183.9L15.7 182.6C8.5 158.7 1.2 134.8 -6 110.9L-6.4 114C6 94.9 18.3 75.9 30.7 56.8L31.5 55.6L31.4 54.1C30.3 39.5 29.2 24.9 28.1 10.2C27.7 5.3 27.3 0.5 27 -4.4C23.7 -4.1 20.3 -3.9 17 -3.6C17.5 1.3 18 6.2 18.4 11.1C19.8 25.7 21.2 40.3 22.6 54.9L23.3 52.2C11.3 71.5 -0.6 90.7 -12.6 110L-13.5 111.5L-13 113.1C-5.2 136.8 2.5 160.6 10.3 184.4L10.6 182C-2.9 204 -16.4 226 -29.9 248C-32.5 252.2 -35 256.3 -37.6 260.5Z'},
    {c:'b',x0:-32.2,x1:56.9,d:'M-32.2 257.9C-29.1 260 -25.9 262 -22.8 264.1C-20 260.1 -17.1 256.2 -14.2 252.2C0.9 231.2 16 210.2 31.1 189.3L33.2 186.4L32.3 182.3C26.7 158 21.1 133.6 15.6 109.2L14.1 118.1C27.5 99.3 41 80.6 54.4 61.8L56.9 58.4L56.6 53.4C55.8 38.7 55 24.1 54.2 9.5C54 4.5 53.7 -0.4 53.5 -5.3C43.5 -4.4 33.5 -3.6 23.5 -2.7C24.1 2.2 24.7 7.1 25.3 11.9C27 26.5 28.7 41.1 30.4 55.6L32.6 47.2C20.4 66.8 8.1 86.3 -4.1 105.9L-6.9 110.4L-5.6 114.8C1.5 138.7 8.6 162.7 15.7 186.7L16.9 179.7C3.2 201.6 -10.6 223.5 -24.3 245.4C-26.9 249.5 -29.5 253.7 -32.2 257.9Z'},
    {c:'w',x0:-14.4,x1:74.5,d:'M-14.4 251.7C-10.1 254.2 -5.9 256.8 -1.5 259.3C1 255.4 3.6 251.4 6.2 247.5C18.8 228.2 31.5 209 44.1 189.7L46.2 186.6L45.5 181.9C42 157.7 38.6 133.5 35.2 109.3L33 120C44.9 103.9 56.8 87.7 68.7 71.5L71.3 67.9L71.6 62C72.3 44.7 73.1 27.4 73.9 10.1C74.1 5.4 74.3 0.7 74.5 -4C61.2 -4 47.8 -4 34.5 -4C34.7 0.7 34.9 5.4 35.1 10.1C35.9 27.4 36.7 44.7 37.4 62L40.3 52.5C29.9 69.7 19.5 86.8 9 104L5.6 109.5L6.8 114.7C12.4 138.5 18 162.3 23.5 186.1L24.9 178.3C14 198.6 3.1 218.9 -7.8 239.2C-10 243.4 -12.2 247.5 -14.4 251.7Z'},
    {c:'w',x0:401.9,x1:467.3,d:'M401.9 259C407.7 262.3 413.5 265.7 419.2 269C421.6 264.7 423.9 260.4 426.3 256.2C439.3 232.4 452.3 208.7 465.4 185L467.3 181.8L465.9 178C455.5 154.2 445.2 130.4 434.8 106.6L434.6 111.9C444 92.3 453.5 72.8 462.9 53.2L463.6 51.8L463.3 50.1C460.6 37.3 457.9 24.4 455.2 11.6C454.2 6.9 453.2 2.1 452.2 -2.7C449.7 -2.2 447.3 -1.8 444.8 -1.3C445.6 3.5 446.4 8.3 447.2 13.1C449.4 26.1 451.5 39 453.7 51.9L454.1 48.8C443.9 67.9 433.6 87 423.4 106.1L422.1 108.9L423.2 111.4C432.5 135.6 441.8 159.8 451.1 184L451.6 177C437.6 200.2 423.5 223.3 409.5 246.5C407 250.7 404.5 254.8 401.9 259Z'},
    {c:'b',x0:418.6,x1:472.5,d:'M418.6 260.1C421.5 261.7 424.5 263.3 427.4 264.9C429.7 260.7 432 256.5 434.3 252.3C446.7 229.5 459.1 206.7 471.5 184L472.5 182.3L471.7 180.4C460.9 156.5 450.2 132.6 439.4 108.7L439.3 111.4C448.6 92.1 457.9 72.9 467.2 53.6L467.6 52.8L467.4 52C464.3 39.2 461.3 26.4 458.2 13.6C457.1 8.9 456 4.3 454.8 -0.4C453.6 -0.1 452.4 0.1 451.2 0.4C452.2 5.1 453.2 9.8 454.2 14.5C457 27.4 459.8 40.2 462.6 53L462.8 51.4C453.1 70.5 443.4 89.5 433.7 108.6L433 110L433.6 111.3C443.8 135.4 454.1 159.5 464.3 183.6L464.5 180C451.6 202.5 438.7 225 425.8 247.5C423.4 251.7 421 255.9 418.6 260.1Z'},
    {c:'r',x0:429.3,x1:474.2,d:'M429.3 259.9C430.8 260.6 432.2 261.4 433.7 262.1C435.9 257.9 438.1 253.6 440.2 249.3C451.4 227.2 462.6 205 473.8 182.9L474.2 182.1L473.9 181.2C463.4 156.9 452.9 132.7 442.5 108.4L442.4 109.7C451.3 90.8 460.2 71.9 469.1 53L469.3 52.6L469.2 52.2C465.6 38.4 462.1 24.5 458.5 10.7C457.3 6.1 456.1 1.4 454.9 -3.2C454.3 -3.1 453.7 -2.9 453.1 -2.8C454.2 1.9 455.4 6.5 456.5 11.2C460 25.1 463.4 38.9 466.8 52.8L466.9 52C457.8 70.7 448.7 89.5 439.6 108.3L439.3 109L439.5 109.6C449.7 134 459.9 158.4 470.1 182.8L470.2 181.1C458.8 203.1 447.3 225.1 435.9 247.1C433.7 251.3 431.5 255.6 429.3 259.9Z'},
    {c:'y',x0:434.7,x1:484.1,d:'M434.7 260.5C439.2 262.5 443.8 264.5 448.3 266.5C450.2 262.2 452.1 257.8 453.9 253.4C463.6 230.6 473.3 207.8 483 185L484.1 182.7L483.1 180.2C472.7 156 462.3 131.9 451.9 107.7L451.9 111.4C459.5 92.6 467.2 73.8 474.9 55L475.4 53.9L475.1 52.5C471.3 39 467.4 25.5 463.6 12C462.3 7.4 461 2.8 459.7 -1.7C457.9 -1.2 456.1 -0.8 454.3 -0.3C455.4 4.3 456.6 8.9 457.7 13.5C461.1 27.2 464.5 40.8 467.9 54.5L468.1 52C459.8 70.6 451.5 89.1 443.1 107.6L442.4 109.5L443.1 111.3C452.7 135.8 462.3 160.3 471.9 184.8L472 180C461.5 202.5 451.1 225 440.7 247.5C438.7 251.8 436.7 256.1 434.7 260.5Z'},
    {c:'w',x0:449.4,x1:489.4,d:'M449.4 256.1C452.5 257.4 455.5 258.6 458.6 259.9C460.4 255.6 462.1 251.3 463.9 246.9C472.2 226.3 480.5 205.7 488.8 185.1L489.4 183.6L488.8 181.9C478.2 156.9 467.6 131.8 457 106.8L456.9 109.3C464.7 91.4 472.5 73.5 480.3 55.5L480.7 54.7L480.4 53.8C476.1 39.3 471.7 24.9 467.3 10.4C466 5.9 464.7 1.5 463.3 -3C462.1 -2.7 460.9 -2.3 459.7 -2C461 2.5 462.2 7 463.5 11.5C467.5 26.1 471.5 40.6 475.6 55.2L475.7 53.5C467.5 71.2 459.3 89 451.1 106.7L450.5 108L451 109.2C461.1 134.5 471.2 159.8 481.2 185.1L481.2 181.9C472.5 202.3 463.7 222.8 454.9 243.2C453.1 247.5 451.2 251.8 449.4 256.1Z'},
    {c:'b',x0:457.8,x1:509.0,d:'M458.2 255.5C467.7 258.5 477.3 261.5 486.8 264.5C488 260 489.3 255.5 490.5 251C496.3 230.1 502 209.1 507.8 188.2L509 184.6L507.6 180.2C497.4 155.4 487.2 130.5 477 105.7L477.1 112.2C482.8 94.2 488.5 76.1 494.3 58.1L495.1 55.9L494.3 53.1C488.9 38.1 483.5 23 478.1 7.9C476.5 3.5 474.9 -0.9 473.3 -5.2C469.8 -4.1 466.2 -2.9 462.7 -1.8C463.9 2.7 465.2 7.2 466.5 11.6C470.9 27 475.3 42.4 479.7 57.9L479.7 52.9C472.8 70.5 465.9 88.2 458.9 105.8L457.8 109.4L459 112.3C467.5 137.8 476 163.3 484.4 188.8L484.2 180.8C477.1 201.4 469.9 221.9 462.8 242.4C461.2 246.8 459.7 251.2 458.2 255.5Z'},
    {c:'w',x0:446.8,x1:536.9,d:'M446.8 245.3C458.3 252.1 469.7 258.9 481.2 265.7C483.4 261.6 485.7 257.4 487.9 253.3C498.8 232.9 509.6 212.6 520.5 192.3L523.5 187.8L522.5 181C517 157.2 511.4 133.4 505.9 109.6L503.9 119.3C514.3 102.1 524.7 85 535.2 67.8L536.8 65.6L536.9 62C536.2 44.7 535.4 27.4 534.6 10.1C534.4 5.4 534.2 0.7 534 -4C529 -4 524 -4 519 -4C518.8 0.7 518.6 5.4 518.4 10.1C517.6 27.4 516.8 44.7 516.1 62L517.8 56.2C505.9 72.4 494 88.5 482.1 104.7L479.1 109.8L480.1 114.4C483.6 138.6 487 162.8 490.5 187L492.5 175.7C479.8 194.9 467.2 214.2 454.6 233.5C452 237.4 449.4 241.3 446.8 245.3Z'},
    {c:'b',x0:487.4,x1:566.5,d:'M514.2 255.5C517.1 257.1 519.9 258.8 522.8 260.5C525.3 256 527.8 251.6 530.3 247.2C541.9 226.6 553.5 206.1 565.1 185.6L566.5 183.2L564.8 181C545 155.7 525.2 130.4 505.5 105.1L505.9 108.2C512.6 91.1 519.2 74 525.9 57L526.4 55.8L525.7 54.7C516.6 39.5 507.5 24.3 498.5 9.2C495.8 4.8 493.2 0.4 490.6 -3.9C489.5 -3.3 488.5 -2.7 487.4 -2.1C489.9 2.4 492.4 6.8 495 11.2C503.7 26.6 512.5 41.9 521.3 57.3L521.1 55C514.1 72 507.1 88.9 500.1 105.8L499.4 107.5L500.5 108.9C519.8 134.6 539 160.3 558.2 186L557.9 181.4C545.9 201.7 533.9 222 522 242.3C519.3 246.7 516.8 251.1 514.2 255.5Z'},
    {c:'y',x0:509.3,x1:596.5,d:'M557.7 258.4C559.2 259.1 560.8 259.9 562.3 260.6C564.5 255.7 566.7 250.9 569 246C577.9 226.5 586.9 206.9 595.9 187.4L596.5 186.1L595.6 185.1C570.9 158.2 546.3 131.3 521.7 104.4L521.9 106.2C532 85.3 542 64.4 552.1 43.5L552.5 42.8L551.9 42.2C541.8 31.2 531.7 20.2 521.5 9.2C517.9 5.2 514.3 1.3 510.7 -2.6C510.2 -2.2 509.8 -1.8 509.3 -1.4C512.9 2.6 516.5 6.6 520 10.5C530 21.6 540.1 32.7 550.1 43.8L549.9 42.5C539.6 63.2 529.3 84 519.1 104.8L518.6 105.8L519.3 106.6C543.7 133.7 568.1 160.8 592.4 187.9L592.1 185.6C582.9 205.1 573.7 224.5 564.6 244C562.3 248.8 560 253.6 557.7 258.4Z'},
    {c:'b',x0:513.8,x1:653.0,d:'M566.4 268.5C581.8 274.8 597.2 281.2 612.6 287.5C614.7 281.7 616.8 275.9 618.9 270.1C628.5 243.9 638.1 217.6 647.6 191.4L653 179.7L643.2 168.9C615.2 143.1 587.2 117.2 559.2 91.3L561.8 110.2C572.8 88.6 583.7 66.9 594.7 45.2L600.2 36.3L591.3 28.9C574.3 17 557.3 5.1 540.3 -6.8C535.3 -10.4 530.2 -13.9 525.2 -17.4C521.4 -12.5 517.6 -7.5 513.8 -2.6C518.5 1.4 523.3 5.4 528 9.3C543.9 22.6 559.8 35.9 575.7 49.1L572.3 32.8C559.6 53.4 546.9 74.1 534.2 94.8L528.5 106L536.8 113.7C562.5 141.8 588.1 169.9 613.8 198.1L609.4 175.6C597.6 201 585.9 226.3 574.2 251.7C571.6 257.3 569 262.9 566.4 268.5Z'},
    {c:'b',x0:575.5,x1:703.1,d:'M656.7 258.9C658.2 259.6 659.8 260.4 661.3 261.1C663.8 255.7 666.3 250.3 668.8 244.9C680 221.1 691.2 197.2 702.4 173.4L703.1 171.9L701.8 170.9C668.7 144.5 635.6 118.2 602.5 91.8L602.9 93.6C612.1 71.6 621.4 49.5 630.6 27.5L631 26.5L630.1 25.9C617.4 19 604.8 12.1 592.1 5.2C586.9 2.4 581.7 -0.5 576.5 -3.3C576.2 -2.8 575.8 -2.2 575.5 -1.7C580.7 1.2 585.9 4.1 591.1 7C603.7 14 616.3 21 628.9 28.1L628.4 26.5C619 48.5 609.5 70.4 600.1 92.4L599.7 93.5L600.5 94.2C633.4 120.8 666.3 147.5 699.2 174.1L698.6 171.6C687.2 195.4 675.8 219.1 664.5 242.9C661.9 248.2 659.3 253.6 656.7 258.9Z'},
  ];

  /* Paint runs. p = the chevron each one hangs off, so it travels with it. */
  var DRIPS = [
    {x:-53.5,y:43.5,y2:86.5,c:'b',w:5,p:2},
    {x:-60.5,y:187.5,y2:230.5,c:'b',w:5,p:2},
    {x:-67.5,y:200.5,y2:217.5,c:'b',w:5,p:1},
    {x:-46.5,y:38.5,y2:67.5,c:'b',w:5,p:2},
    {x:6.5,y:72.5,y2:127.5,c:'y',w:5,p:8},
    {x:13.5,y:55.5,y2:98.5,c:'y',w:5,p:8},
    {x:593.0,y:41.0,y2:65.0,c:'b',w:5,p:19},
    {x:586.0,y:45.0,y2:91.0,c:'b',w:5,p:19},
  ];

  /* Where the composition sits. The photo's left edge is pinned to
     53.5% across the 1440 content column — the proportion in the
     concept — but never so far left that the chevrons reach the
     headline, which is 445px wide. */
  var PHOTO_AT = 0.5354;
  var CLEAR_OF_LOGO = 682;   /* 445 logo + 55 gap + 182 of left cluster */
  var STAG = 0.35;           /* share of the spread the stagger eats */
  var OVERHANG = 40;         /* how far past the window the gathered
                                pack reaches, each side              */
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- helpers ------------------------------------------------ */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  /* ---- DOM — owned by hero-switch.js --------------------------- */
  var HERO = window.HERO;
  if (!HERO) return;
  var hl = HERO.band, cv = HERO.canvas;
  var ctx = cv.getContext('2d');

  /* ---- photos ------------------------------------------------- */
  var photos = null;
  function loadPhotos() {
    if (photos) return;
    photos = PHOTOS.map(function (src) { var im = new Image(); im.src = src; return im; });
  }

  /* ---- one-time piece prep ------------------------------------ */
  var built = false, H = 256;
  function prep() {
    if (built) return;
    built = true;
    var col = {
      b: cssVar('--hero-blue', '#253AFF'),
      y: cssVar('--hero-yellow', '#E8B33D'),
      r: cssVar('--hero-red', '#C32440'),
      w: '#FFFFFF'
    };
    /* Left and right clusters gather into their own half of the
       window, so every piece travels straight out from where it
       lands and none of them cross. */
    var left = [], right = [];
    PIECES.forEach(function (p, i) {
      p.fill = col[p.c];
      p.path = new Path2D(p.d);
      p.cx = (p.x0 + p.x1) / 2;
      (p.cx < CFG.photoW / 2 ? left : right).push(p);
      /* idle sway — its own phase and amount, so the pack never
         breathes in unison */
      p.ph = (i * 2.399) % 6.283;
      p.amp = 0.45 + ((i * 7919) % 100) / 100 * 0.8;
      p.tw = ((i * 104729) % 100) / 100 - 0.5;   /* rotation sign and size */
    });
    function tile(list, from, to) {
      var span = to - from;
      list.forEach(function (p, k) {
        p.gx = from + (k + 0.5) / list.length * span - p.cx;
      });
    }
    tile(left, -OVERHANG, CFG.photoW / 2);
    tile(right, CFG.photoW / 2, CFG.photoW + OVERHANG);

    /* how late a piece starts: the ones that end up furthest out
       leave last, so the pack opens from the middle */
    var far = 1;
    PIECES.forEach(function (p) { far = Math.max(far, Math.abs(p.cx - CFG.photoW / 2)); });
    PIECES.forEach(function (p) { p.rank = Math.abs(p.cx - CFG.photoW / 2) / far; });

    DRIPS.forEach(function (d, i) {
      d.fill = col[d.c];
      d.piece = PIECES[d.p];
      d.seed = i * 0.37;
    });
  }

  /* ---- geometry ----------------------------------------------- */
  var geo = null;
  function layout() {
    var m = HERO.measure();
    H = m.h;
    var want = m.cx + m.cw * PHOTO_AT;
    var px = Math.max(want, m.cx + CLEAR_OF_LOGO);
    geo = { vw: m.w, px: px, mid: CFG.photoW / 2 };
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var m = HERO.measure();
    cv.width = Math.max(1, Math.round(m.w * dpr));
    cv.height = Math.max(1, Math.round(m.h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  /* ---- loop --------------------------------------------------- */
  var raf = 0, t0 = 0, on = false, visible = true;

  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (!geo || !photos) return;

    var el = (now - t0) / 1000 * CFG.speed;
    var cyc = CFG.spread + CFG.hold + CFG.gather + CFG.pause;
    if (REDUCED) el = CFG.spread + CFG.hold * 0.5;
    var tt = el % cyc;
    var idx = Math.floor(el / cyc) % photos.length;

    var p, mode, th = 0;
    if (tt < CFG.spread) { p = tt / CFG.spread; mode = 0; }
    else if (tt < CFG.spread + CFG.hold) { p = 1; mode = 1; th = tt - CFG.spread; }
    else if (tt < CFG.spread + CFG.hold + CFG.gather) {
      p = 1 - (tt - CFG.spread - CFG.hold) / CFG.gather; mode = 2; th = CFG.hold;
    } else { p = 0; mode = 3; }

    /* the sway and the tilt tick in frames, not continuously —
       that stepped beat is what reads as cut-out */
    var stepT = Math.floor(el * CFG.fps) / CFG.fps;

    ctx.clearRect(0, 0, geo.vw, H);
    ctx.save();
    ctx.translate(geo.px, 0);   /* 0,0 is now the photo window's top-left */

    /* ---- photo: a curtain opening from the centre out ---------- */
    var img = photos[idx];
    if (img && img.complete && img.naturalWidth) {
      var rp = clamp((p - 0.12) / 0.78, 0, 1);
      rp = mode === 2 ? smooth(rp) : easeOutCubic(rp);
      var halfOpen = geo.mid * rp;
      if (halfOpen > 0.5) {
        var u = tt / cyc;
        var zoom = CFG.zoom + 0.03 * u;
        var dw = CFG.photoW * zoom, dh = H * zoom;
        var kbx = (u - 0.5) * 2 * 4, kby = (u - 0.5) * 2 * 2;
        var dx = -(dw - CFG.photoW) / 2 + kbx, dy = -(dh - H) / 2 + kby;
        var sA = img.naturalWidth / img.naturalHeight, dA = dw / dh, sw, sh, sx, sy;
        if (sA > dA) { sh = img.naturalHeight; sw = sh * dA; sx = (img.naturalWidth - sw) / 2; sy = 0; }
        else { sw = img.naturalWidth; sh = sw / dA; sx = 0; sy = (img.naturalHeight - sh) / 2; }
        ctx.save();
        ctx.beginPath();
        ctx.rect(geo.mid - halfOpen, 0, halfOpen * 2, H);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.restore();
      }
    }

    /* ---- how far each piece has travelled ---------------------- */
    var i, pc, pi, dxs;
    for (i = 0; i < PIECES.length; i++) {
      pc = PIECES[i];
      pi = clamp((p - pc.rank * STAG) / (1 - STAG), 0, 1);
      pi = mode === 2 ? smooth(pi) : easeOutQuart(pi);
      dxs = pc.gx * (1 - pi);
      if (mode === 0 || mode === 1) {
        dxs += Math.sin(stepT * 1.15 + pc.ph) * pc.amp * CFG.drift * pi;
      }
      pc.dx = dxs;
      pc.pi = pi;
    }

    /* ---- paint runs -------------------------------------------- */
    /* Each starts at a different point in the hold and eases out,
       so the paint slows as it runs. They travel with the chevron
       edge they hang off. */
    if (mode === 1 || mode === 2) {
      ctx.lineCap = 'round';
      for (i = 0; i < DRIPS.length; i++) {
        var d = DRIPS[i];
        var delay = ((d.seed + idx * 0.13) % 1) * 0.30 * CFG.hold;
        var dp = clamp((th - delay) / (0.45 * CFG.hold), 0, 1);
        if (dp <= 0) continue;
        ctx.globalAlpha = mode === 2 ? clamp(p * 2, 0, 1) : 1;
        ctx.strokeStyle = d.fill;
        ctx.lineWidth = d.w;
        ctx.beginPath();
        ctx.moveTo(d.x + d.piece.dx, d.y);
        ctx.lineTo(d.x + d.piece.dx, d.y + (d.y2 - d.y) * easeOutQuart(dp));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    /* ---- chevrons ---------------------------------------------- */
    for (i = 0; i < PIECES.length; i++) {
      pc = PIECES[i];
      var a = pc.tw * CFG.tilt * (Math.PI / 180) *
              Math.sin(stepT * 0.9 + pc.ph) * (mode === 0 || mode === 1 ? pc.pi : 0);
      ctx.save();
      ctx.translate(pc.cx + pc.dx, H / 2);
      if (a) ctx.rotate(a);
      ctx.translate(-pc.cx, -H / 2);
      ctx.fillStyle = pc.fill;
      ctx.fill(pc.path);
      ctx.restore();
    }

    ctx.restore();
  }

  function start() { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(draw); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  /* ---- on/off -------------------------------------------------- */
  function apply(mode) {
    on = (mode === 'b');
    if (on) { prep(); loadPhotos(); resize(); if (visible) start(); }
    else stop();
  }
  document.addEventListener('hero:change', function (e) { apply(e.detail.mode); });

  var rt = 0;
  window.addEventListener('resize', function () {
    if (!on) return;
    clearTimeout(rt);
    rt = setTimeout(resize, 120);
  });
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    if (on && visible) start(); else stop();
  });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      var seen = es[0].isIntersecting;
      if (on && seen && visible) start();
      else if (!seen) stop();
    }, { threshold: 0 }).observe(hl);
  }

  apply(HERO.mode());
})();
