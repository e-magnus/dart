/**
 * Checkout Advice from Gummi Lilli
 * Based on optimal checkout strategies for each score
 * Provides guidance in Icelandic
 */

const checkoutAdvice = {
    // 2-10
    2: { advice: "Bull's eye fyrir 2 stig!", optimal: "Bull" },
    3: { advice: "Einn í 1 eða Bull fyrir 3!", optimal: "1" },
    4: { advice: "Tvöfalt 2 (D2) er besta leiðin!", optimal: "D2" },
    5: { advice: "Einn í 1 og tvöfalt 2 (D2)!", optimal: "1, D2" },
    6: { advice: "Tvöfalt 3 (D3) fyrir sigur!", optimal: "D3" },
    7: { advice: "Þríhyrningur 3 eða 1 og D3!", optimal: "3, D2 eða 1, D3" },
    8: { advice: "Tvöfalt 4 (D4) er þægilegast!", optimal: "D4" },
    9: { advice: "Einn í 1 og D4 eða 5 og D2!", optimal: "1, D4 eða 5, D2" },
    10: { advice: "Tvöfalt 5 (D5) er best!", optimal: "D5" },
    
    // 11-20
    11: { advice: "Þríhyrningur 3 og D4 er gott val!", optimal: "3, D4" },
    12: { advice: "Tvöfalt 6 (D6) fyrir sigur!", optimal: "D6" },
    13: { advice: "Þríhyrningur 3 og D5 eða 5 og D4!", optimal: "3, D5 eða 5, D4" },
    14: { advice: "Tvöfalt 7 (D7) er klassískt!", optimal: "D7" },
    15: { advice: "Þríhyrningur 7 og D4 eða 3 og D6!", optimal: "7, D4 eða 3, D6" },
    16: { advice: "Tvöfalt 8 (D8) er örugg leið!", optimal: "D8" },
    17: { advice: "Þríhyrningur 9 og D4 eða 1 og D8!", optimal: "9, D4 eða 1, D8" },
    18: { advice: "Tvöfalt 9 (D9) fyrir útskot!", optimal: "D9" },
    19: { advice: "Þríhyrningur 3 og D8 eða 7 og D6!", optimal: "3, D8 eða 7, D6" },
    20: { advice: "Tvöfalt 10 (D10) er sterkt val!", optimal: "D10" },
    
    // 21-30
    21: { advice: "Þríhyrningur 5 og D8 eða 1 og D10!", optimal: "5, D8 eða 1, D10" },
    22: { advice: "Tvöfalt 11 (D11) fyrir sigur!", optimal: "D11" },
    23: { advice: "Þríhyrningur 7 og D8 eða 3 og D10!", optimal: "7, D8 eða 3, D10" },
    24: { advice: "Tvöfalt 12 (D12) eða 8 og D8!", optimal: "D12 eða 8, D8" },
    25: { advice: "Þríhyrningur 9 og D8 eða 5 og D10!", optimal: "9, D8 eða 5, D10" },
    26: { advice: "Tvöfalt 13 (D13) eða 10 og D8!", optimal: "D13 eða 10, D8" },
    27: { advice: "Þríhyrningur 11 og D8 eða 7 og D10!", optimal: "11, D8 eða 7, D10" },
    28: { advice: "Tvöfalt 14 (D14) eða 12 og D8!", optimal: "D14 eða 12, D8" },
    29: { advice: "Þríhyrningur 13 og D8 eða 9 og D10!", optimal: "13, D8 eða 9, D10" },
    30: { advice: "Tvöfalt 15 (D15) eða 14 og D8!", optimal: "D15 eða 14, D8" },
    
    // 31-40
    31: { advice: "Þríhyrningur 15 og D8 eða 11 og D10!", optimal: "15, D8 eða 11, D10" },
    32: { advice: "Tvöfalt 16 (D16) eða 16 og D8!", optimal: "D16 eða 16, D8" },
    33: { advice: "Þríhyrningur 17 og D8 eða 13 og D10!", optimal: "17, D8 eða 13, D10" },
    34: { advice: "Tvöfalt 17 (D17) eða 18 og D8!", optimal: "D17 eða 18, D8" },
    35: { advice: "Þríhyrningur 19 og D8 eða 15 og D10!", optimal: "19, D8 eða 15, D10" },
    36: { advice: "Tvöfalt 18 (D18) eða D20 og D8!", optimal: "D18 eða 20, D8" },
    37: { advice: "Þríhyrningur 5 og D16 eða 17 og D10!", optimal: "5, D16 eða 17, D10" },
    38: { advice: "Tvöfalt 19 (D19) eða 6 og D16!", optimal: "D19 eða 6, D16" },
    39: { advice: "Þríhyrningur 7 og D16 eða 19 og D10!", optimal: "7, D16 eða 19, D10" },
    40: { advice: "Tvöfalt 20 (D20) - klassíski endalausnin!", optimal: "D20" },
    
    // 41-50
    41: { advice: "Þríhyrningur 9 og D16 eða 1 og D20!", optimal: "9, D16 eða 1, D20" },
    42: { advice: "Þríhyrningur 10 og D16 eða 6 og D18!", optimal: "10, D16 eða 6, D18" },
    43: { advice: "Þríhyrningur 11 og D16 eða 3 og D20!", optimal: "11, D16 eða 3, D20" },
    44: { advice: "Þríhyrningur 12 og D16 eða 4 og D20!", optimal: "12, D16 eða 4, D20" },
    45: { advice: "Þríhyrningur 13 og D16 eða 5 og D20!", optimal: "13, D16 eða 5, D20" },
    46: { advice: "Þríhyrningur 14 og D16 eða 6 og D20!", optimal: "14, D16 eða 6, D20" },
    47: { advice: "Þríhyrningur 15 og D16 eða 7 og D20!", optimal: "15, D16 eða 7, D20" },
    48: { advice: "Þríhyrningur 16 og D16 eða 8 og D20!", optimal: "16, D16 eða 8, D20" },
    49: { advice: "Þríhyrningur 17 og D16 eða 9 og D20!", optimal: "17, D16 eða 9, D20" },
    50: { advice: "Þríhyrningur 18 og D16 eða 10 og D20!", optimal: "18, D16 eða 10, D20" },
    
    // 51-60
    51: { advice: "Þríhyrningur 19 og D16 eða 11 og D20!", optimal: "19, D16 eða 11, D20" },
    52: { advice: "Þríhyrningur 20 og D16 eða 12 og D20!", optimal: "20, D16 eða 12, D20" },
    53: { advice: "Þríhyrningur 13 og D20 eða 17 og D18!", optimal: "13, D20 eða 17, D18" },
    54: { advice: "Þríhyrningur 14 og D20 eða 18 og D18!", optimal: "14, D20 eða 18, D18" },
    55: { advice: "Þríhyrningur 15 og D20!", optimal: "15, D20" },
    56: { advice: "Þríhyrningur 16 og D20 eða T16 og D4!", optimal: "16, D20 eða T16, D4" },
    57: { advice: "Þríhyrningur 17 og D20 eða T19 og Bull!", optimal: "17, D20 eða T19, Bull" },
    58: { advice: "Þríhyrningur 18 og D20 eða T18 og D2!", optimal: "18, D20 eða T18, D2" },
    59: { advice: "Þríhyrningur 19 og D20 eða T19 og D1!", optimal: "19, D20 eða T19, D1" },
    60: { advice: "Þríhyrningur 20 og D20 eða T20 og Bull!", optimal: "20, D20 eða T20, Bull" },
    
    // 61-70
    61: { advice: "T15 og D8 eða 25 og D18!", optimal: "T15, D8 eða 25, D18" },
    62: { advice: "T10 og D16 eða 10 og T10 og D16!", optimal: "T10, D16" },
    63: { advice: "T13 og D12 eða 13 og Bull!", optimal: "T13, D12 eða 13, Bull" },
    64: { advice: "T16 og D8 eða 16 og Bull!", optimal: "T16, D8 eða 16, Bull" },
    65: { advice: "T19 og D4 eða T11 og D16!", optimal: "T19, D4 eða T11, D16" },
    66: { advice: "T10 og D18 eða T14 og D12!", optimal: "T10, D18 eða T14, D12" },
    67: { advice: "T17 og D8 eða T9 og D20!", optimal: "T17, D8 eða T9, D20" },
    68: { advice: "T20 og D4 eða T16 og D10!", optimal: "T20, D4 eða T16, D10" },
    69: { advice: "T19 og D6 eða T15 og D12!", optimal: "T19, D6 eða T15, D12" },
    70: { advice: "T18 og D8 eða T10 og D20!", optimal: "T18, D8 eða T10, D20" },
    
    // 71-80
    71: { advice: "T17 og D10 eða T13 og D16!", optimal: "T17, D10 eða T13, D16" },
    72: { advice: "T16 og D12 eða T12 og D18!", optimal: "T16, D12 eða T12, D18" },
    73: { advice: "T19 og D8 eða T15 og D14!", optimal: "T19, D8 eða T15, D14" },
    74: { advice: "T14 og D16 eða T18 og D10!", optimal: "T14, D16 eða T18, D10" },
    75: { advice: "T17 og D12 eða T15 og D15!", optimal: "T17, D12 eða T15, D15" },
    76: { advice: "T20 og D8 eða T16 og D14!", optimal: "T20, D8 eða T16, D14" },
    77: { advice: "T19 og D10 eða T15 og D16!", optimal: "T19, D10 eða T15, D16" },
    78: { advice: "T18 og D12 eða T14 og D18!", optimal: "T18, D12 eða T14, D18" },
    79: { advice: "T13 og D20 eða T19 og D11!", optimal: "T13, D20 eða T19, D11" },
    80: { advice: "T20 og D10 eða T16 og D16!", optimal: "T20, D10 eða T16, D16" },
    
    // 81-90
    81: { advice: "T19 og D12 eða T15 og D18!", optimal: "T19, D12 eða T15, D18" },
    82: { advice: "T14 og D20 eða Bull og D16!", optimal: "T14, D20 eða Bull, D16" },
    83: { advice: "T17 og D16!", optimal: "T17, D16" },
    84: { advice: "T20 og D12 eða T16 og D18!", optimal: "T20, D12 eða T16, D18" },
    85: { advice: "T15 og D20 eða T19 og D14!", optimal: "T15, D20 eða T19, D14" },
    86: { advice: "T18 og D16!", optimal: "T18, D16" },
    87: { advice: "T17 og D18!", optimal: "T17, D18" },
    88: { advice: "T16 og D20 eða T20 og D14!", optimal: "T16, D20 eða T20, D14" },
    89: { advice: "T19 og D16!", optimal: "T19, D16" },
    90: { advice: "T20 og D15 eða T18 og D18!", optimal: "T20, D15 eða T18, D18" },
    
    // 91-100
    91: { advice: "T17 og D20!", optimal: "T17, D20" },
    92: { advice: "T20 og D16!", optimal: "T20, D16" },
    93: { advice: "T19 og D18!", optimal: "T19, D18" },
    94: { advice: "T18 og D20!", optimal: "T18, D20" },
    95: { advice: "T19 og D19!", optimal: "T19, D19" },
    96: { advice: "T20 og D18!", optimal: "T20, D18" },
    97: { advice: "T19 og D20!", optimal: "T19, D20" },
    98: { advice: "T20 og D19!", optimal: "T20, D19" },
    99: { advice: "T17 og Bull eða T19 og D20 (1)!", optimal: "T17, Bull" },
    100: { advice: "T20 og D20 - klassískt!", optimal: "T20, D20" },
    
    // 101-110
    101: { advice: "T17 og Bull eða T20 og 1 og D20!", optimal: "T17, Bull" },
    102: { advice: "T20 og 2 og D20!", optimal: "T20, 2, D20" },
    103: { advice: "T19 og 6 og D20!", optimal: "T19, 6, D20" },
    104: { advice: "T18 og Bull!", optimal: "T18, Bull" },
    105: { advice: "T20 og 5 og D20!", optimal: "T20, 5, D20" },
    106: { advice: "T20 og 6 og D20!", optimal: "T20, 6, D20" },
    107: { advice: "T19 og Bull!", optimal: "T19, Bull" },
    108: { advice: "T20 og 8 og D20!", optimal: "T20, 8, D20" },
    109: { advice: "T20 og 9 og D20!", optimal: "T20, 9, D20" },
    110: { advice: "T20 og Bull!", optimal: "T20, Bull" },
    
    // 111-120
    111: { advice: "T19 og Bull eða T20 og 11 og D20!", optimal: "T19, Bull" },
    112: { advice: "T20 og 12 og D20!", optimal: "T20, 12, D20" },
    113: { advice: "T19 og 16 og D20!", optimal: "T19, 16, D20" },
    114: { advice: "T20 og 14 og D20!", optimal: "T20, 14, D20" },
    115: { advice: "T20 og 15 og D20 eða T19 og 18 og D20!", optimal: "T20, 15, D20" },
    116: { advice: "T20 og 16 og D20!", optimal: "T20, 16, D20" },
    117: { advice: "T20 og 17 og D20!", optimal: "T20, 17, D20" },
    118: { advice: "T20 og 18 og D20!", optimal: "T20, 18, D20" },
    119: { advice: "T19 og Bull!", optimal: "T19, Bull" },
    120: { advice: "T20 og 20 og D20!", optimal: "T20, 20, D20" },
    
    // 121-130
    121: { advice: "T20 og T17 og Bull!", optimal: "T20, T17, Bull" },
    122: { advice: "T18 og Bull og D20!", optimal: "T18, Bull, D20" },
    123: { advice: "T19 og T16 og D6!", optimal: "T19, T16, D6" },
    124: { advice: "T20 og T14 og D10!", optimal: "T20, T14, D10" },
    125: { advice: "Bull og Bull og Bull!", optimal: "Bull, Bull, Bull" },
    126: { advice: "T19 og T19 og D6!", optimal: "T19, T19, D6" },
    127: { advice: "T20 og T17 og D8!", optimal: "T20, T17, D8" },
    128: { advice: "T18 og T14 og D16!", optimal: "T18, T14, D16" },
    129: { advice: "T19 og T16 og D12!", optimal: "T19, T16, D12" },
    130: { advice: "T20 og T18 og D8!", optimal: "T20, T18, D8" },
    
    // 131-140
    131: { advice: "T20 og T13 og D16!", optimal: "T20, T13, D16" },
    132: { advice: "Bull og Bull og D16!", optimal: "Bull, Bull, D16" },
    133: { advice: "T20 og T19 og D8!", optimal: "T20, T19, D8" },
    134: { advice: "T20 og T14 og D16!", optimal: "T20, T14, D16" },
    135: { advice: "Bull og Bull og 35 og Bull eða T20 og T15 og D15!", optimal: "Bull, Bull, 35, Bull" },
    136: { advice: "T20 og T20 og D8!", optimal: "T20, T20, D8" },
    137: { advice: "T20 og T19 og D10!", optimal: "T20, T19, D10" },
    138: { advice: "T20 og T18 og D12!", optimal: "T20, T18, D12" },
    139: { advice: "T20 og T13 og D20!", optimal: "T20, T13, D20" },
    140: { advice: "T20 og T20 og D10!", optimal: "T20, T20, D10" },
    
    // 141-150
    141: { advice: "T20 og T19 og D12!", optimal: "T20, T19, D12" },
    142: { advice: "T20 og T14 og D20!", optimal: "T20, T14, D20" },
    143: { advice: "T20 og T17 og D16!", optimal: "T20, T17, D16" },
    144: { advice: "T20 og T20 og D12!", optimal: "T20, T20, D12" },
    145: { advice: "T20 og T15 og D20!", optimal: "T20, T15, D20" },
    146: { advice: "T20 og T18 og D16!", optimal: "T20, T18, D16" },
    147: { advice: "T20 og T17 og D18!", optimal: "T20, T17, D18" },
    148: { advice: "T20 og T20 og D14!", optimal: "T20, T20, D14" },
    149: { advice: "T20 og T19 og D16!", optimal: "T20, T19, D16" },
    150: { advice: "T20 og T18 og D18!", optimal: "T20, T18, D18" },
    
    // 151-160
    151: { advice: "T20 og T17 og D20!", optimal: "T20, T17, D20" },
    152: { advice: "T20 og T20 og D16!", optimal: "T20, T20, D16" },
    153: { advice: "T20 og T19 og D18!", optimal: "T20, T19, D18" },
    154: { advice: "T20 og T18 og D20!", optimal: "T20, T18, D20" },
    155: { advice: "T20 og T19 og D19!", optimal: "T20, T19, D19" },
    156: { advice: "T20 og T20 og D18!", optimal: "T20, T20, D18" },
    157: { advice: "T20 og T19 og D20!", optimal: "T20, T19, D20" },
    158: { advice: "T20 og T20 og D19!", optimal: "T20, T20, D19" },
    159: { advice: "T20 og T19 og 2 og D20!", optimal: "T20, T19, 2, D20" },
    160: { advice: "T20 og T20 og D20!", optimal: "T20, T20, D20" },
    
    // 161-170
    161: { advice: "T20 og T17 og Bull!", optimal: "T20, T17, Bull" },
    162: { advice: "T20 og T20 og 2 og D20!", optimal: "T20, T20, 2, D20" },
    163: { advice: "T20 og T19 og 6 og D20!", optimal: "T20, T19, 6, D20" },
    164: { advice: "T20 og T18 og Bull!", optimal: "T20, T18, Bull" },
    165: { advice: "T20 og T19 og 8 og D20!", optimal: "T20, T19, 8, D20" },
    166: { advice: "T20 og T20 og 6 og D20!", optimal: "T20, T20, 6, D20" },
    167: { advice: "T20 og T19 og Bull!", optimal: "T20, T19, Bull" },
    168: { advice: "T20 og T20 og 8 og D20!", optimal: "T20, T20, 8, D20" },
    169: { advice: "T20 og T19 og 12 og D20!", optimal: "T20, T19, 12, D20" },
    170: { advice: "T20 og T20 og Bull!", optimal: "T20, T20, Bull" },
    
    // Add ranges for larger scores (simplified)
    // For scores above 170, we'll use simple logic
};

/**
 * Get checkout advice for a given score
 * @param {number} score - The remaining score
 * @returns {Object} - { advice: string, optimal: string }
 */
function getCheckoutAdvice(score) {
    // Invalid scores
    if (score < 2) {
        return { advice: "Þú ert kominn undir 2! Passa þig!", optimal: "" };
    }
    
    // Impossible checkouts (odd numbers below 3, etc.)
    if (score === 169 || score === 168 || score === 166 || score === 165 || score === 163 || score === 162 || score === 159) {
        // These are actually possible, already covered above
    }
    
    // Direct lookup
    if (checkoutAdvice[score]) {
        return checkoutAdvice[score];
    }
    
    // For scores above 170
    if (score > 170) {
        if (score > 180) {
            return { 
                advice: `${score} stig eftir - byrjaðu á T20!`, 
                optimal: "T20, T20, ..." 
            };
        } else {
            return { 
                advice: `${score} stig - stefndu á T20, T20 til að komast niður!`, 
                optimal: "T20, T20" 
            };
        }
    }
    
    // Fallback for any missing scores
    return { 
        advice: "Lækkaðu skorið með T20!", 
        optimal: "T20" 
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getCheckoutAdvice, checkoutAdvice };
}
