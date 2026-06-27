/** Authored lesson definitions for generate-poker-theory.mjs */
export const lessons = [
  {
    "lessonId": "pt_fundamentals",
    "order": 1,
    "title": "Poker Fundamentals",
    "subtitle": "Rules, streets, and how a hand unfolds",
    "topics": [
      "Texas Hold'em rules",
      "Blinds",
      "Streets",
      "Showdown"
    ],
    "intro": [
      "Texas Hold'em is the most widely studied poker variant. Each player receives two private hole cards, then five community cards are dealt in stages: the flop (three cards), the turn (one card), and the river (one card).",
      "Betting happens before the flop (preflop), after the flop, after the turn, and after the river. You win by making the best five-card hand from your hole cards plus the board, or by being the last player remaining after everyone else folds.",
      "Understanding the flow of a hand — who acts when, what the blinds are, and when cards are revealed — is the foundation for every strategic concept that follows."
    ],
    "questions": [
      {
        "id": "pt_f1_q1",
        "kind": "standard",
        "concept": "hole_cards",
        "question": "How many private hole cards does each player receive in Texas Hold'em?",
        "options": [
          "1",
          "2",
          "4",
          "5"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Hold'em uses one private card only in exotic variants; standard Texas Hold'em always deals two.",
          "B": "Correct. Every player gets exactly two hole cards that only they may look at until showdown.",
          "C": "Four hole cards is Omaha, not Hold'em.",
          "D": "Five private cards would leave no community cards for the shared board."
        },
        "remediation": [
          {
            "id": "pt_f1_q1_r1",
            "question": "At the start of a Hold'em hand, each player is dealt this many face-down cards:",
            "options": [
              "2",
              "3",
              "5",
              "7"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — two hole cards.",
              "B": "Three is not standard Hold'em.",
              "C": "Five is the community board total, not hole cards.",
              "D": "Seven is used in some stud games, not Hold'em."
            }
          },
          {
            "id": "pt_f1_q1_r2",
            "question": "Your hidden cards in Texas Hold'em are called hole cards. How many do you get?",
            "options": [
              "1",
              "2",
              "4",
              "6"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "One hole card isn't Hold'em.",
              "B": "Correct — exactly two hole cards.",
              "C": "Four hole cards describes Omaha.",
              "D": "Six isn't a standard deal in Hold'em."
            }
          }
        ]
      },
      {
        "id": "pt_f1_q2",
        "kind": "standard",
        "concept": "community_cards",
        "question": "How many community cards are dealt on the board in a full Texas Hold'em hand?",
        "options": [
          "3",
          "4",
          "5",
          "7"
        ],
        "correctAnswer": 2,
        "explanations": {
          "A": "Three is only the flop; the turn and river add two more.",
          "B": "Four is still missing the river.",
          "C": "Correct — flop (3) + turn (1) + river (1) = 5 community cards.",
          "D": "Seven would exceed a standard deck's shared cards."
        },
        "remediation": [
          {
            "id": "pt_f1_q2_r1",
            "question": "The flop shows three community cards. After the turn and river, the board has:",
            "options": [
              "4 cards",
              "5 cards",
              "6 cards",
              "7 cards"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Four is only through the turn.",
              "B": "Correct — five total community cards.",
              "C": "Six isn't standard.",
              "D": "Seven isn't standard."
            }
          },
          {
            "id": "pt_f1_q2_r2",
            "question": "In Hold'em you combine your hole cards with community cards. The board ends with:",
            "options": [
              "3 cards",
              "4 cards",
              "5 cards",
              "6 cards"
            ],
            "correctAnswer": 2,
            "explanations": {
              "A": "Three is just the flop.",
              "B": "Four is missing the river.",
              "C": "Correct — five community cards total.",
              "D": "Six isn't used in Hold'em."
            }
          }
        ]
      },
      {
        "id": "pt_f1_q3",
        "kind": "standard",
        "concept": "streets",
        "question": "What is the correct order of betting rounds in Hold'em?",
        "options": [
          "Preflop → Turn → Flop → River",
          "Preflop → Flop → Turn → River",
          "Flop → Preflop → Turn → River",
          "Preflop → Flop → River → Turn"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Turn before flop is wrong.",
          "B": "Correct — preflop, then flop, turn, and river.",
          "C": "Flop never comes before preflop.",
          "D": "River always comes after the turn."
        },
        "remediation": [
          {
            "id": "pt_f1_q3_r1",
            "question": "After hole cards are dealt, the first betting round is:",
            "options": [
              "The flop",
              "Preflop",
              "The river",
              "Showdown"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Flop is second.",
              "B": "Correct — betting starts preflop.",
              "C": "River is near the end.",
              "D": "Showdown follows all betting."
            }
          },
          {
            "id": "pt_f1_q3_r2",
            "question": "The turn is dealt after which street?",
            "options": [
              "Preflop",
              "The flop",
              "The river",
              "Showdown"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Preflop has no community cards yet.",
              "B": "Correct — flop, then turn.",
              "C": "River comes after the turn.",
              "D": "Showdown is last."
            }
          }
        ]
      },
      {
        "id": "pt_f1_q4",
        "kind": "standard",
        "concept": "blinds",
        "question": "In a $1/$2 cash game, the small blind posts:",
        "options": [
          "$1",
          "$2",
          "$0.50",
          "$3"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — the first number is the small blind.",
          "B": "The big blind is $2.",
          "C": "$0.50 isn't the posted blind here.",
          "D": "$3 isn't standard for this structure."
        },
        "remediation": [
          {
            "id": "pt_f1_q4_r1",
            "question": "The player directly left of the dealer posts the small blind of:",
            "options": [
              "$1",
              "$2",
              "Half the big blind only in tournaments",
              "$0"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct in a $1/$2 game.",
              "B": "That's the big blind.",
              "C": "Cash games use fixed blinds as labeled.",
              "D": "Blinds are mandatory forced bets."
            }
          },
          {
            "id": "pt_f1_q4_r2",
            "question": "In $1/$2, the big blind is:",
            "options": [
              "$1",
              "$2",
              "$4",
              "$0.50"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "$1 is the small blind.",
              "B": "Correct — the second number is the big blind.",
              "C": "$4 isn't labeled.",
              "D": "$0.50 isn't the big blind here."
            }
          }
        ]
      },
      {
        "id": "pt_f1_q5",
        "kind": "standard",
        "concept": "showdown",
        "question": "At showdown, a player must show cards to win the pot if:",
        "options": [
          "They were the last aggressor on the river",
          "They are called and must table a hand to claim the pot",
          "They folded on the turn",
          "They checked preflop"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Last aggressor rule decides show order, not eligibility.",
          "B": "Correct — if called at showdown you must show to win.",
          "C": "Folded players cannot win.",
          "D": "Checking preflop doesn't determine showdown rules."
        },
        "remediation": [
          {
            "id": "pt_f1_q5_r1",
            "question": "If you bet the river and get called, you generally must:",
            "options": [
              "Muck without showing",
              "Show your hand to win",
              "Fold automatically",
              "Reveal one card only"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "You can't win without showing when called.",
              "B": "Correct — table your cards to claim the pot.",
              "C": "You didn't fold; you were called.",
              "D": "Full hand is shown at showdown."
            }
          },
          {
            "id": "pt_f1_q5_r2",
            "question": "A player who folded before the river:",
            "options": [
              "Can still win if they had the nuts",
              "Is out of the hand",
              "Shows cards anyway",
              "Posts another blind"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Folded means out of the hand.",
              "B": "Correct — once you fold you cannot win the pot.",
              "C": "No need to show after folding.",
              "D": "Blinds apply to new hands."
            }
          }
        ]
      },
      {
        "id": "pt_f1_q6",
        "kind": "standard",
        "concept": "best_five",
        "question": "You hold A♠ K♦ and the board is Q♠ J♠ T♥ 2♣ 7♦. Your best five-card hand is:",
        "options": [
          "High card ace",
          "A straight",
          "A flush",
          "Two pair"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "You use A-K with the board to make Broadway: A-K-Q-J-T.",
          "B": "Correct — you have a Broadway straight (A high).",
          "C": "No five spades; not a flush.",
          "D": "Two pair isn't your best five here."
        },
        "remediation": [
          {
            "id": "pt_f1_q6_r1",
            "question": "Hole cards A-K on board Q-J-T-x-x makes:",
            "options": [
              "Pair of aces",
              "Straight",
              "Full house",
              "Flush draw only"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Pair ignores the straight.",
              "B": "Correct — A-K-Q-J-T is a straight.",
              "C": "No pair for a boat.",
              "D": "No flush completed."
            }
          },
          {
            "id": "pt_f1_q6_r2",
            "question": "You may use zero, one, or two hole cards to make your best hand. Here A-K with Q-J-T uses:",
            "options": [
              "0 hole cards",
              "1 hole card",
              "2 hole cards",
              "Must use both always"
            ],
            "correctAnswer": 2,
            "explanations": {
              "A": "Board alone is Q-J-T high card.",
              "B": "One card can't beat the straight.",
              "C": "Correct — both A and K complete the straight.",
              "D": "You choose the best five, not always both."
            }
          }
        ]
      },
      {
        "id": "pt_f1_q7",
        "kind": "standard",
        "concept": "actions",
        "question": "Which action keeps you in the hand without putting more chips in (when no bet faces you)?",
        "options": [
          "Fold",
          "Check",
          "Raise",
          "Muck"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Fold ends your participation.",
          "B": "Correct — check passes action with no additional chips.",
          "C": "Raise adds chips.",
          "D": "Muck is surrendering at showdown."
        },
        "remediation": [
          {
            "id": "pt_f1_q7_r1",
            "question": "When no one has bet this street, you may:",
            "options": [
              "Check",
              "Fold only",
              "Must bet",
              "Show cards"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — check is allowed.",
              "B": "Fold is allowed but not required.",
              "C": "Betting is optional.",
              "D": "Showdown isn't now."
            }
          },
          {
            "id": "pt_f1_q7_r2",
            "question": "Facing no bet, checking means:",
            "options": [
              "You forfeit the pot",
              "You stay in without adding chips",
              "You must call",
              "You win automatically"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Forfeit is fold.",
              "B": "Correct — pass action, stay in.",
              "C": "Nothing to call.",
              "D": "Check doesn't win the pot."
            }
          }
        ]
      },
      {
        "id": "pt_f1_q8",
        "kind": "standard",
        "concept": "side_pots",
        "question": "Three players remain. Short stack goes all-in for $50, two deeper stacks build a $200 side pot. Who can win the side pot?",
        "options": [
          "Only the short stack",
          "Only the two deeper players",
          "All three players",
          "The dealer"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Short stack wasn't eligible for chips beyond their $50.",
          "B": "Correct — only players who matched the extra action contest the side pot.",
          "C": "Short stack can't win chips they didn't cover.",
          "D": "Dealer doesn't play."
        },
        "remediation": [
          {
            "id": "pt_f1_q8_r1",
            "question": "Side pots exist when:",
            "options": [
              "Everyone has equal stacks",
              "A player is all-in for less than others continue betting",
              "The board pairs",
              "Blinds are posted"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Equal stacks don't create sides.",
              "B": "Correct — unequal all-ins create side pots.",
              "C": "Board pairing is unrelated.",
              "D": "Blinds start the hand."
            }
          },
          {
            "id": "pt_f1_q8_r2",
            "question": "The main pot is contested by:",
            "options": [
              "Only the biggest stack",
              "Every player who matched the shortest all-in",
              "Folded players",
              "Nobody"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "All matched players can win main.",
              "B": "Correct — all who put in up to the short stack amount.",
              "C": "Folded players are out.",
              "D": "Main pot always has eligible players."
            }
          }
        ]
      },
      {
        "id": "pt_f1_q9",
        "kind": "challenge",
        "concept": "button_advantage",
        "question": "Why is the dealer button considered valuable?",
        "options": [
          "It posts the big blind next hand",
          "It acts last on postflop streets",
          "It sees hole cards first",
          "It always wins ties"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Button moves each hand; blind posting isn't the advantage.",
          "B": "Correct — acting last postflop lets you see others' actions first.",
          "C": "Deal order isn't strategic advantage.",
          "D": "Ties split; button doesn't win."
        },
        "remediation": [
          {
            "id": "pt_f1_q9_r1",
            "question": "Postflop, the button typically acts:",
            "options": [
              "First",
              "Last among remaining players",
              "Only on the river",
              "Never"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "First is out of position.",
              "B": "Correct — last to act is the advantage.",
              "C": "Button acts every postflop street.",
              "D": "Button always has a seat."
            }
          },
          {
            "id": "pt_f1_q9_r2",
            "question": "Acting last on the flop lets you:",
            "options": [
              "See opponents' actions before deciding",
              "Deal the turn",
              "Skip the blind",
              "Show cards early"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — information advantage.",
              "B": "Dealer deals but that's not the strategic edge.",
              "C": "Blinds still apply.",
              "D": "Showdown is later."
            }
          }
        ]
      },
      {
        "id": "pt_f1_q10",
        "kind": "challenge",
        "concept": "all_in_rules",
        "question": "Player A shoves all-in for $100. Player B has $300 and calls. Player C has $500 and raises to $250 total. What happens?",
        "options": [
          "C's raise is illegal",
          "B may only call $100 unless they have chips to match C",
          "C wins automatically",
          "Hand ends preflop"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Raises are legal if C has chips.",
          "B": "Correct — B must match available action; side pots may form if B can't cover full raise.",
          "C": "No automatic win.",
          "D": "Hand continues with remaining action."
        },
        "remediation": [
          {
            "id": "pt_f1_q10_r1",
            "question": "When a short all-in doesn't reopen betting, a full raise:",
            "options": [
              "Always reopens action for players who already acted",
              "May not reopen if the raise increment is insufficient",
              "Ends the hand",
              "Only the dealer can call"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Reopening depends on raise size rules.",
              "B": "Correct — insufficient raises may not reopen.",
              "C": "Hand continues.",
              "D": "Players act, not dealer."
            }
          },
          {
            "id": "pt_f1_q10_r2",
            "question": "Multiple all-ins at different stack depths usually create:",
            "options": [
              "One pot only",
              "Main and side pots",
              "No pot",
              "Split pots always"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Different amounts create sides.",
              "B": "Correct — main pot plus side pot(s).",
              "C": "Pots always exist.",
              "D": "Split only at showdown if tied."
            }
          }
        ]
      }
    ],
    "placementQuestions": [
      {
        "id": "pt_f1_p1",
        "concept": "hole_cards",
        "question": "Each Hold'em player receives how many hole cards?",
        "options": [
          "1",
          "2",
          "3",
          "5"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "One isn't Hold'em.",
          "B": "Correct.",
          "C": "Three isn't standard.",
          "D": "Five is the board total."
        }
      },
      {
        "id": "pt_f1_p2",
        "concept": "community",
        "question": "Total community cards on the board:",
        "options": [
          "3",
          "4",
          "5",
          "6"
        ],
        "correctAnswer": 2,
        "explanations": {
          "A": "Three is flop only.",
          "B": "Four is through turn.",
          "C": "Correct.",
          "D": "Six isn't standard."
        }
      },
      {
        "id": "pt_f1_p3",
        "concept": "streets",
        "question": "First betting round:",
        "options": [
          "Flop",
          "Preflop",
          "River",
          "Showdown"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Flop is second.",
          "B": "Correct.",
          "C": "River is late.",
          "D": "Showdown is last."
        }
      },
      {
        "id": "pt_f1_p4",
        "concept": "blinds",
        "question": "$2/$5 game: small blind is:",
        "options": [
          "$2",
          "$5",
          "$1",
          "$2.50"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — first number.",
          "B": "That's the big blind.",
          "C": "$1 isn't labeled.",
          "D": "$2.50 isn't standard."
        }
      },
      {
        "id": "pt_f1_p5",
        "concept": "showdown",
        "question": "To win when called on the river you must:",
        "options": [
          "Fold",
          "Show a hand",
          "Post a blind",
          "Check only"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Fold loses.",
          "B": "Correct.",
          "C": "Blinds are pre-hand.",
          "D": "Check doesn't claim a bet pot alone."
        }
      },
      {
        "id": "pt_f1_p6",
        "concept": "best_five",
        "question": "Best hand uses at most how many hole cards?",
        "options": [
          "0",
          "1",
          "2",
          "5"
        ],
        "correctAnswer": 2,
        "explanations": {
          "A": "Zero is possible (play the board).",
          "B": "One is common.",
          "C": "Correct — maximum two.",
          "D": "Five hole cards isn't Hold'em."
        }
      },
      {
        "id": "pt_f1_p7",
        "concept": "actions",
        "question": "No bet facing you — you can:",
        "options": [
          "Check",
          "Must fold",
          "Must raise",
          "Win pot"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Fold optional.",
          "C": "Raise optional.",
          "D": "Doesn't win yet."
        }
      },
      {
        "id": "pt_f1_p8",
        "concept": "button",
        "question": "The button acts postflop:",
        "options": [
          "First",
          "Last (among players in hand)",
          "Never",
          "Only preflop"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "First is wrong.",
          "B": "Correct.",
          "C": "Button acts postflop.",
          "D": "Button acts both."
        }
      }
    ]
  },
  {
    "lessonId": "pt_hand_rankings",
    "order": 2,
    "title": "Hand Rankings",
    "subtitle": "From high card to royal flush — knowing what beats what",
    "topics": [
      "Hand hierarchy",
      "Kickers",
      "Playing the board",
      "Split pots"
    ],
    "intro": [
      "Every poker decision eventually reduces to comparing five-card hands. Texas Hold'em uses a fixed hierarchy: high card, one pair, two pair, three of a kind, straight, flush, full house, four of a kind, straight flush, and royal flush.",
      "You always form the best five-card hand from exactly five cards — using zero, one, or both hole cards plus community cards. When two players tie on the rank of a hand, kickers (the side cards) or the board itself decide the winner.",
      "Misreading hand strength is one of the costliest beginner mistakes. This lesson trains you to rank hands quickly, spot counterfeited pairs, and recognize when the board alone is the best hand for everyone."
    ],
    "questions": [
      {
        "id": "pt_hr_q1",
        "kind": "standard",
        "concept": "hierarchy",
        "question": "Which hand ranks highest?",
        "options": [
          "Straight",
          "Flush",
          "Full house",
          "Three of a kind"
        ],
        "correctAnswer": 2,
        "explanations": {
          "A": "A straight beats three of a kind but loses to flush and full house.",
          "B": "A flush beats straight and three of a kind but loses to full house.",
          "C": "Correct — full house (trips + pair) beats flush, straight, and three of a kind.",
          "D": "Three of a kind is strong but below straight and flush."
        },
        "remediation": [
          {
            "id": "pt_hr_q1_r1",
            "question": "Which beats a flush?",
            "options": [
              "Two pair",
              "Full house",
              "Straight",
              "One pair"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Two pair loses to flush.",
              "B": "Correct — full house beats flush.",
              "C": "Straight loses to flush.",
              "D": "One pair loses to flush."
            }
          },
          {
            "id": "pt_hr_q1_r2",
            "question": "Rank these from lowest to highest: flush, straight, full house.",
            "options": [
              "Flush < straight < full house",
              "Straight < flush < full house",
              "Full house < flush < straight",
              "Straight < full house < flush"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Flush beats straight.",
              "B": "Correct — straight, then flush, then full house.",
              "C": "Full house is highest of the three.",
              "D": "Full house beats flush."
            }
          }
        ]
      },
      {
        "id": "pt_hr_q2",
        "kind": "standard",
        "concept": "royal_flush",
        "question": "A royal flush is:",
        "options": [
          "A♠ K♠ Q♠ J♠ T♠",
          "Five cards of the same suit any ranks",
          "A♥ K♦ Q♣ J♠ T♥ mixed suits",
          "Four aces plus any kicker"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — A-K-Q-J-T all the same suit is the royal flush, the highest possible hand.",
          "B": "Any same-suit five cards is a flush; royal requires the top five ranks.",
          "C": "Mixed suits cannot form a flush.",
          "D": "Four aces is four of a kind, not a royal flush."
        },
        "remediation": [
          {
            "id": "pt_hr_q2_r1",
            "question": "The best possible Hold'em hand is:",
            "options": [
              "Four of a kind",
              "Straight flush A-high",
              "Full house aces full",
              "Flush king-high"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Four of a kind is beaten by straight flush.",
              "B": "Correct — royal flush (A-high straight flush) is unbeatable.",
              "C": "Full house loses to straight flush.",
              "D": "King-high flush is far from the nuts."
            }
          },
          {
            "id": "pt_hr_q2_r2",
            "question": "Which is a straight flush?",
            "options": [
              "9♣ 8♣ 7♣ 6♣ 5♣",
              "A♦ K♦ Q♦ J♦ 9♦",
              "K♠ Q♠ J♠ T♠ 9♥",
              "A♣ A♦ A♥ K♠ K♣"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — five consecutive clubs is a straight flush.",
              "B": "Missing the ten for a straight.",
              "C": "Nine of hearts breaks the flush.",
              "D": "Two pair, not a straight flush."
            }
          }
        ]
      },
      {
        "id": "pt_hr_q3",
        "kind": "standard",
        "concept": "two_pair",
        "question": "Board: K♠ 7♥ 7♦ 3♣ 3♠. You hold K♦ Q♣. Your best hand is:",
        "options": [
          "Two pair, kings and sevens",
          "Two pair, kings and threes",
          "Full house, sevens full of threes",
          "Pair of kings"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "K-K-7-7-3 uses kings and threes with a seven kicker.",
          "B": "Correct — kings and threes with a seven kicker: K-K-3-3-7.",
          "C": "Full house would need trips + pair; you have two pair only.",
          "D": "Two pair is better than one pair."
        },
        "remediation": [
          {
            "id": "pt_hr_q3_r1",
            "question": "You have A♠ A♥, board 9♣ 9♦ 5♠ 2♥ K♣. Best hand:",
            "options": [
              "Two pair aces and nines",
              "Two pair nines and fives",
              "Full house nines full",
              "Pair of aces"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — A-A-9-9-K beats using only board pairs.",
              "B": "Nines and fives ignores your aces.",
              "C": "No trips on board for a boat.",
              "D": "Two pair beats one pair."
            }
          },
          {
            "id": "pt_hr_q3_r2",
            "question": "Two pair means:",
            "options": [
              "Two different pairs among your five cards",
              "Two hole cards paired",
              "Two players each have a pair",
              "Second-best pair on board"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — e.g. K-K-7-7-x is two pair.",
              "B": "Hole cards need not both pair.",
              "C": "Unrelated to number of players.",
              "D": "Board pairs alone can make two pair for you."
            }
          }
        ]
      },
      {
        "id": "pt_hr_q4",
        "kind": "standard",
        "concept": "kicker",
        "question": "You: A♦ J♦. Villain: A♠ T♠. Board: A♥ 8♣ 5♦ 2♠ K♣. Who wins?",
        "options": [
          "You — higher kicker (J vs T)",
          "Villain — higher kicker",
          "Split pot",
          "Villain — second pair"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — both have pair of aces; your J kicker beats T.",
          "B": "Villain's ten is lower than your jack.",
          "C": "Different kickers mean no split.",
          "D": "Only one pair of aces matters."
        },
        "remediation": [
          {
            "id": "pt_hr_q4_r1",
            "question": "Same pair on board, you have K kicker, opponent Q kicker. Winner:",
            "options": [
              "You",
              "Opponent",
              "Split",
              "Dealer"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — higher kicker wins when pairs tie.",
              "B": "Queen loses to king.",
              "C": "Splits need identical five-card hands.",
              "D": "Dealer doesn't win pots."
            }
          },
          {
            "id": "pt_hr_q4_r2",
            "question": "Kickers matter when:",
            "options": [
              "Both players have the same hand rank",
              "Someone has a flush",
              "Board is paired twice",
              "Preflop only"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — tied hand ranks compare side cards.",
              "B": "Flush rank is decided by highest card in flush.",
              "C": "Paired boards can still need kickers.",
              "D": "Kickers apply at showdown."
            }
          }
        ]
      },
      {
        "id": "pt_hr_q5",
        "kind": "standard",
        "concept": "play_board",
        "question": "Board: Q♠ J♠ T♠ 9♠ 8♠. All players checked to showdown. Result?",
        "options": [
          "Player with A♠ in hole wins",
          "Split pot — everyone plays the board",
          "Highest hole card wins",
          "Flush draw loses"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "A spade in hole doesn't improve on a straight flush board.",
          "B": "Correct — the board is a straight flush; hole cards irrelevant.",
          "C": "Hole cards don't matter when board is best for all.",
          "D": "Board completed the flush."
        },
        "remediation": [
          {
            "id": "pt_hr_q5_r1",
            "question": "When the board is the best five for all players:",
            "options": [
              "Strongest hole card wins",
              "Split pot",
              "First to act wins",
              "Pot is dead"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Hole cards don't beat the board if board is best five.",
              "B": "Correct — tied best hand splits.",
              "C": "Action order doesn't decide winner.",
              "D": "Pot goes to tied winners."
            }
          },
          {
            "id": "pt_hr_q5_r2",
            "question": "You may use zero hole cards when:",
            "options": [
              "The board alone beats any combo with your cards",
              "You fold preflop",
              "You have pocket aces",
              "Never"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — 'playing the board' uses zero hole cards.",
              "B": "Folded players don't showdown.",
              "C": "Aces might still play if board isn't best alone.",
              "D": "Zero hole cards is legal when board is strongest."
            }
          }
        ]
      },
      {
        "id": "pt_hr_q6",
        "kind": "standard",
        "concept": "full_house",
        "question": "Which is a full house?",
        "options": [
          "K♠ K♥ K♦ 7♣ 7♠",
          "K♠ K♥ 7♦ 7♣ 3♠",
          "7♠ 7♥ 7♦ 7♣ K♠",
          "K♠ Q♠ J♠ T♠ 9♠"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — three kings and two sevens is a full house.",
          "B": "Two pair only — need three of one rank.",
          "C": "Four sevens is four of a kind.",
          "D": "Straight flush, not full house."
        },
        "remediation": [
          {
            "id": "pt_hr_q6_r1",
            "question": "Full house is also called:",
            "options": [
              "Boat",
              "Wheel",
              "Broadway",
              "Nut flush"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — 'boat' is common slang for full house.",
              "B": "Wheel is A-2-3-4-5 straight.",
              "C": "Broadway is A-high straight.",
              "D": "Nut flush is ace-high flush."
            }
          },
          {
            "id": "pt_hr_q6_r2",
            "question": "8♣ 8♦ 8♠ K♥ K♦ is:",
            "options": [
              "Two pair",
              "Full house eights full",
              "Trips only",
              "Four eights"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Two pair needs two ranks paired, not three eights.",
              "B": "Correct — eights full of kings.",
              "C": "Trips is three of a kind without a pair.",
              "D": "Four of a kind needs four eights."
            }
          }
        ]
      },
      {
        "id": "pt_hr_q7",
        "kind": "standard",
        "concept": "straight",
        "question": "Which is a valid straight?",
        "options": [
          "A♠ 2♥ 3♦ 4♣ 5♠",
          "K♠ Q♠ J♠ T♠ 9♥",
          "A♠ K♥ Q♦ J♣ 9♠",
          "2♠ 4♥ 6♦ 8♣ T♠"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — wheel: ace plays low as 1 in A-2-3-4-5.",
          "B": "Nine of hearts breaks the straight.",
          "C": "Gap at ten — not five consecutive ranks.",
          "D": "Even ranks skip — not a straight."
        },
        "remediation": [
          {
            "id": "pt_hr_q7_r1",
            "question": "The 'wheel' straight uses ace as:",
            "options": [
              "High only",
              "Low only (A-2-3-4-5)",
              "Wild card",
              "Kicker only"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Ace-high is Broadway, different straight.",
              "B": "Correct — ace can be low in the wheel.",
              "C": "No wild cards in Hold'em.",
              "D": "Ace is part of the straight, not kicker."
            }
          },
          {
            "id": "pt_hr_q7_r2",
            "question": "A straight beats:",
            "options": [
              "Flush",
              "Three of a kind",
              "Full house",
              "Straight flush"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Flush beats straight.",
              "B": "Correct — straight beats three of a kind.",
              "C": "Full house beats straight.",
              "D": "Straight flush beats straight."
            }
          }
        ]
      },
      {
        "id": "pt_hr_q8",
        "kind": "standard",
        "concept": "flush",
        "question": "You hold 2♠ 3♠. Board: A♠ K♠ 7♥ 5♠ 9♦. Your hand is:",
        "options": [
          "Pair of aces",
          "Ace-high flush",
          "Straight flush draw only",
          "High card ace"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Pair of aces ignores the five spades available.",
          "B": "Correct — A-K-9-5-2 spades is an ace-high flush.",
          "C": "You completed the flush, not just a draw.",
          "D": "Flush beats high card."
        },
        "remediation": [
          {
            "id": "pt_hr_q8_r1",
            "question": "Flush tie is broken by:",
            "options": [
              "Highest card in the flush, then next cards",
              "Hole card suits",
              "Who bet last",
              "Smallest card"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — compare top down through all five flush cards.",
              "B": "Suit of hole cards doesn't matter for tie.",
              "C": "Betting order doesn't break ties.",
              "D": "Highest cards win, not lowest."
            }
          },
          {
            "id": "pt_hr_q8_r2",
            "question": "Five hearts on board, you have no hearts. You:",
            "options": [
              "Have a flush",
              "Use the board flush",
              "Have high card only if board flush is best",
              "Automatically win"
            ],
            "correctAnswer": 2,
            "explanations": {
              "A": "You don't hold a heart but board gives everyone a flush.",
              "B": "Correct — you play the board flush; kickers may tie.",
              "C": "High card only applies when the board isn't a completed flush.",
              "D": "Ties split; no automatic win."
            }
          }
        ]
      },
      {
        "id": "pt_hr_q9",
        "kind": "challenge",
        "concept": "counterfeit",
        "question": "You hold 8♦ 8♠. Board: 8♥ K♣ K♦ 5♠ 5♥. Your effective hand vs someone with A♠ K♠?",
        "options": [
          "You win — trips eights",
          "They win — kings full of fives beat eights full",
          "Split",
          "You win — higher trips"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "You have eights full but they have kings full of eights.",
          "B": "Correct — higher trips in full house wins: K-K-K-8-8 beats 8-8-8-K-K.",
          "C": "Different full houses don't split.",
          "D": "Trip eights became second best after board paired."
        },
        "remediation": [
          {
            "id": "pt_hr_q9_r1",
            "question": "Counterfeiting often happens when:",
            "options": [
              "Board pairs and reduces your pocket pair's value",
              "You hit a flush",
              "You fold preflop",
              "Blinds increase"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — board pairs can 'counterfeit' your pocket pair.",
              "B": "Flush improves your hand.",
              "C": "Folding ends the hand.",
              "D": "Blinds don't change hand ranks."
            }
          },
          {
            "id": "pt_hr_q9_r2",
            "question": "Pocket tens on board T-K-K-5-5 makes:",
            "options": [
              "Stronger than K-x",
              "Weaker full house than K-x with a king",
              "Always the nuts",
              "High card"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Tens full loses to kings full.",
              "B": "Correct — opponent with a king has kings full of tens.",
              "C": "Kings full beats tens full.",
              "D": "Full house beats high card."
            }
          }
        ]
      },
      {
        "id": "pt_hr_q10",
        "kind": "challenge",
        "concept": "compare_hands",
        "question": "Board: 9♠ 8♠ 7♦ 6♣ 5♥. Player A: A♠ 2♠. Player B: T♦ T♣. Winner?",
        "options": [
          "A — higher straight",
          "B — higher straight",
          "Split",
          "A — flush"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "A has 9-high straight (9-8-7-6-5); T makes ten-high straight.",
          "B": "Correct — T-9-8-7-6 beats 9-8-7-6-5.",
          "C": "Different straights don't split.",
          "D": "No five spades for a flush."
        },
        "remediation": [
          {
            "id": "pt_hr_q10_r1",
            "question": "Ten-high straight on 9-8-7-6-5 board needs:",
            "options": [
              "A ten in hole or as part of best five",
              "Two spades",
              "Pair of tens only",
              "Ace low"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — T completes T-9-8-7-6.",
              "B": "Suits irrelevant for straight.",
              "C": "Pair doesn't beat straight here.",
              "D": "Ace low is wheel, different board."
            }
          },
          {
            "id": "pt_hr_q10_r2",
            "question": "When both have straights, winner has:",
            "options": [
              "Same five cards always",
              "Higher top card of the straight",
              "Lower cards win",
              "First aggressor"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Straights can differ in high card.",
              "B": "Correct — compare the highest card of the straight.",
              "C": "Higher straight wins.",
              "D": "Aggressor doesn't win ties."
            }
          }
        ]
      }
    ],
    "placementQuestions": [
      {
        "id": "pt_hr_p1",
        "concept": "hierarchy",
        "question": "Which beats a straight?",
        "options": [
          "One pair",
          "Two pair",
          "Flush",
          "High card"
        ],
        "correctAnswer": 2,
        "explanations": {
          "A": "Pair and two pair lose to straight.",
          "B": "Two pair loses to straight.",
          "C": "Correct.",
          "D": "High card is weakest."
        }
      },
      {
        "id": "pt_hr_p2",
        "concept": "royal",
        "question": "Royal flush is:",
        "options": [
          "A-K-Q-J-T same suit",
          "Any five same suit",
          "Four aces",
          "K-high straight"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "That's any flush.",
          "C": "Four of a kind.",
          "D": "Not necessarily same suit."
        }
      },
      {
        "id": "pt_hr_p3",
        "concept": "kicker",
        "question": "Same pair, you A-kicker, foe Q-kicker:",
        "options": [
          "You win",
          "Foe wins",
          "Split",
          "Board wins"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — ace kicker.",
          "B": "Queen is lower.",
          "C": "Kickers differ.",
          "D": "Players compare hands."
        }
      },
      {
        "id": "pt_hr_p4",
        "concept": "board",
        "question": "Board is best five for all:",
        "options": [
          "Split pot",
          "Button wins",
          "Highest hole card",
          "Pot dead"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — play the board.",
          "B": "Button doesn't auto-win.",
          "C": "Hole cards irrelevant.",
          "D": "Pot to winners."
        }
      },
      {
        "id": "pt_hr_p5",
        "concept": "full_house",
        "question": "Full house contains:",
        "options": [
          "Two pairs only",
          "Three of one rank + pair",
          "Four of a kind",
          "Five sequential"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Two pair is weaker.",
          "B": "Correct.",
          "C": "Quads beat boat.",
          "D": "That's a straight."
        }
      },
      {
        "id": "pt_hr_p6",
        "concept": "wheel",
        "question": "Wheel straight is:",
        "options": [
          "A-K-Q-J-T",
          "A-2-3-4-5",
          "10-9-8-7-6",
          "K-Q-J-T-9"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Broadway.",
          "B": "Correct — ace low.",
          "C": "Ten-high.",
          "D": "King-high."
        }
      },
      {
        "id": "pt_hr_p7",
        "concept": "flush",
        "question": "Ace-high flush beats:",
        "options": [
          "Straight",
          "Full house",
          "Four of a kind",
          "Straight flush"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Boat beats flush.",
          "C": "Quads beat flush.",
          "D": "Straight flush beats flush."
        }
      },
      {
        "id": "pt_hr_p8",
        "concept": "compare",
        "question": "Higher straight wins when:",
        "options": [
          "Top card of straight is higher",
          "More hole cards used",
          "Acted last",
          "Suits match"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Doesn't matter how many hole cards.",
          "C": "Position irrelevant.",
          "D": "Suits don't matter for straight."
        }
      }
    ]
  },
  {
    "lessonId": "pt_position",
    "order": 3,
    "title": "Position & Seat Advantage",
    "subtitle": "Why acting last is worth more than extra cards",
    "topics": [
      "Seat names",
      "Early vs late position",
      "Steals",
      "Squeeze plays"
    ],
    "intro": [
      "Position is the single most important structural advantage in Hold'em. Players who act later on each street see more information before committing chips — who checked, who bet, and how large the pot grew.",
      "Early positions (under the gun and nearby seats) must open tight ranges because many players still act behind them. Late positions (cutoff and button) can widen ranges and steal blinds more profitably.",
      "The blinds are unique: they post forced bets but act last preflop and first postflop. Understanding seat names and action order prevents costly mistakes before you ever look at your cards."
    ],
    "questions": [
      {
        "id": "pt_pos_q1",
        "kind": "standard",
        "concept": "seat_names",
        "question": "In a full-ring game, 'under the gun' (UTG) is:",
        "options": [
          "The player on the button",
          "The first player to act preflop after the blinds",
          "The small blind",
          "The last player to act preflop"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Button acts last preflop among non-blinds.",
          "B": "Correct — UTG is first to act once action reaches the main seats.",
          "C": "Small blind posts and acts early but isn't UTG.",
          "D": "Last preflop is typically the button or cutoff area."
        },
        "remediation": [
          {
            "id": "pt_pos_q1_r1",
            "question": "First voluntary preflop action at a full table usually comes from:",
            "options": [
              "The button",
              "UTG",
              "The big blind",
              "The dealer chip"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Button waits for others.",
              "B": "Correct — UTG opens the action.",
              "C": "BB acts last preflop.",
              "D": "Dealer is a marker, not a seat."
            }
          },
          {
            "id": "pt_pos_q1_r2",
            "question": "UTG stands for:",
            "options": [
              "Under the gun — first to act",
              "Under the game",
              "Ultimate table guard",
              "Unlimited table game"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — first seat to act preflop.",
              "B": "Not a real poker term.",
              "C": "Made up.",
              "D": "Not standard."
            }
          }
        ]
      },
      {
        "id": "pt_pos_q2",
        "kind": "standard",
        "concept": "late_position",
        "question": "Which seat is considered the most advantageous in a typical hand?",
        "options": [
          "Small blind",
          "Big blind",
          "Button (dealer)",
          "UTG"
        ],
        "correctAnswer": 2,
        "explanations": {
          "A": "SB acts first postflop and posts blind.",
          "B": "BB posts more and acts early postflop.",
          "C": "Correct — button acts last postflop on every street.",
          "D": "UTG acts first among openers."
        },
        "remediation": [
          {
            "id": "pt_pos_q2_r1",
            "question": "Acting last postflop gives you:",
            "options": [
              "Less information",
              "More information before you decide",
              "Automatic pot wins",
              "No need to think about ranges"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Last to act sees more, not less.",
              "B": "Correct — you observe others first.",
              "C": "Position doesn't guarantee wins.",
              "D": "Ranges still matter."
            }
          },
          {
            "id": "pt_pos_q2_r2",
            "question": "The dealer button moves:",
            "options": [
              "Every hand clockwise",
              "Only after you win",
              "Never in tournaments",
              "Randomly each street"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — one seat clockwise each hand.",
              "B": "Winning doesn't move the button.",
              "C": "Button moves in all formats.",
              "D": "Streets don't move the button."
            }
          }
        ]
      },
      {
        "id": "pt_pos_q3",
        "kind": "standard",
        "concept": "blind_order",
        "question": "Preflop, who acts last among players still in the hand (excluding folds)?",
        "options": [
          "Small blind",
          "Big blind",
          "Button",
          "UTG"
        ],
        "correctAnswer": 2,
        "explanations": {
          "A": "SB acts near the end but before BB in preflop order.",
          "B": "BB acts last only if no raise; with raises, button often acts last.",
          "C": "Correct — in raised pots the button typically closes the action preflop.",
          "D": "UTG acts first."
        },
        "remediation": [
          {
            "id": "pt_pos_q3_r1",
            "question": "The big blind is posted by:",
            "options": [
              "The player left of the small blind",
              "The player two seats left of the button",
              "The button",
              "UTG"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "SB is one left of button; BB is next.",
              "B": "Correct — BB is two seats left of the button.",
              "C": "Button doesn't post BB.",
              "D": "UTG doesn't post blinds."
            }
          },
          {
            "id": "pt_pos_q3_r2",
            "question": "Small blind posts:",
            "options": [
              "Half the big blind (typically)",
              "Double the big blind",
              "Nothing",
              "Only in tournaments"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — SB is usually half the BB.",
              "B": "SB is smaller, not double.",
              "C": "SB is a forced bet.",
              "D": "Blinds exist in cash games too."
            }
          }
        ]
      },
      {
        "id": "pt_pos_q4",
        "kind": "standard",
        "concept": "open_range",
        "question": "Why should UTG open a tighter range than the button?",
        "options": [
          "UTG sees the flop first",
          "Many players still act behind UTG",
          "UTG has the button next hand",
          "Blinds always fold to UTG"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Flop order differs from preflop opening logic.",
          "B": "Correct — more players behind means more ways to be dominated or squeezed.",
          "C": "Next hand's button is irrelevant to this hand.",
          "D": "Blinds defend often."
        },
        "remediation": [
          {
            "id": "pt_pos_q4_r1",
            "question": "Opening wide from early position is risky because:",
            "options": [
              "You might get raised or called by better hands behind you",
              "The board is already dealt",
              "You must always fold postflop",
              "Position doesn't matter preflop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — players behind can punish wide opens.",
              "B": "Board comes after preflop.",
              "C": "You can continue postflop.",
              "D": "Position matters postflop especially."
            }
          },
          {
            "id": "pt_pos_q4_r2",
            "question": "The cutoff opens wider than UTG mainly because:",
            "options": [
              "Fewer players left to act",
              "Cutoff posts blinds",
              "UTG is on the button",
              "Rules require it"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — fewer opponents behind.",
              "B": "Cutoff doesn't post blinds.",
              "C": "UTG isn't the button.",
              "D": "It's strategy, not a rule."
            }
          }
        ]
      },
      {
        "id": "pt_pos_q5",
        "kind": "standard",
        "concept": "oop_ip",
        "question": "You are 'in position' against an opponent when:",
        "options": [
          "You act before them on every street",
          "You act after them on the current street",
          "You have more chips",
          "You are in the blinds"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Acting first is out of position.",
          "B": "Correct — acting last on a street means you are in position.",
          "C": "Stack size isn't position.",
          "D": "Blinds are usually out of position postflop."
        },
        "remediation": [
          {
            "id": "pt_pos_q5_r1",
            "question": "Out of position (OOP) means:",
            "options": [
              "You act first on a street",
              "You have the nuts",
              "You are on the button",
              "You checked preflop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — OOP acts before your opponent.",
              "B": "Hand strength isn't position.",
              "C": "Button is in position.",
              "D": "Check doesn't define position."
            }
          },
          {
            "id": "pt_pos_q5_r2",
            "question": "Being in position on the river lets you:",
            "options": [
              "See whether opponent checks or bets before you act",
              "Deal extra cards",
              "Skip showdown",
              "Win ties automatically"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — informational edge on the final street.",
              "B": "No extra cards.",
              "C": "Showdown still happens.",
              "D": "Ties still split."
            }
          }
        ]
      },
      {
        "id": "pt_pos_q6",
        "kind": "standard",
        "concept": "steal",
        "question": "A 'steal' attempt usually comes from:",
        "options": [
          "UTG with 7♠ 2♦",
          "Late position with a raise when folds are likely",
          "Big blind checking",
          "Showing cards early"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "UTG opens get called too often for a steal.",
          "B": "Correct — late-position raises can win blinds uncontested.",
          "C": "Checking isn't a steal.",
          "D": "Showing cards isn't a steal."
        },
        "remediation": [
          {
            "id": "pt_pos_q6_r1",
            "question": "Stealing blinds works best when:",
            "options": [
              "Many tight players left to act might fold",
              "You always have aces",
              "You are UTG",
              "Pot is already huge"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — fold equity from late seat matters.",
              "B": "You won't always have aces.",
              "C": "UTG has players behind.",
              "D": "Huge pots mean someone already invested."
            }
          },
          {
            "id": "pt_pos_q6_r2",
            "question": "Button raise first-in is often called a:",
            "options": [
              "Steal or open-raise",
              "Check-raise",
              "Slow play",
              "Muck"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — opening from the button to take blinds.",
              "B": "Check-raise requires a prior bet.",
              "C": "Slow play is trapping.",
              "D": "Muck is folding at showdown."
            }
          }
        ]
      },
      {
        "id": "pt_pos_q7",
        "kind": "standard",
        "concept": "postflop_order",
        "question": "On the flop, who typically acts first?",
        "options": [
          "The button",
          "First active player left of the button",
          "The big blind always",
          "Random seat"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Button acts last, not first.",
          "B": "Correct — first active seat clockwise from the button acts first.",
          "C": "BB acts first only if still in and left of button.",
          "D": "Order is fixed, not random."
        },
        "remediation": [
          {
            "id": "pt_pos_q7_r1",
            "question": "Postflop action starts:",
            "options": [
              "With the small blind if still in the hand",
              "Left of the button among active players",
              "With the last raiser preflop only",
              "On the river"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "SB may act first but rule is left of button.",
              "B": "Correct — clockwise from button.",
              "C": "Preflop aggressor matters in some formats but standard is left of button.",
              "D": "Flop is first postflop street."
            }
          },
          {
            "id": "pt_pos_q7_r2",
            "question": "If only button and BB remain on the flop, first to act is:",
            "options": [
              "Button",
              "Big blind",
              "Split action",
              "Dealer"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "Button acts last on flop.",
              "B": "Correct — BB is left of button and acts first.",
              "C": "Action isn't split.",
              "D": "Dealer doesn't play."
            }
          }
        ]
      },
      {
        "id": "pt_pos_q8",
        "kind": "standard",
        "concept": "defend_bb",
        "question": "Big blind defends wider than early positions because:",
        "options": [
          "BB already has money in the pot and closes preflop action",
          "BB always has position postflop",
          "Rules force BB to call",
          "BB sees hole cards last"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — pot odds and closing action justify wider defense.",
          "B": "BB is usually OOP postflop.",
          "C": "BB can fold to raises.",
          "D": "Hole cards aren't seen last."
        },
        "remediation": [
          {
            "id": "pt_pos_q8_r1",
            "question": "BB gets a discount to call because:",
            "options": [
              "Part of the call is already posted as the blind",
              "Dealer adds chips",
              "SB pays for BB",
              "Antes don't exist"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — you need only complete the blind.",
              "B": "Dealer doesn't add.",
              "C": "SB posts separately.",
              "D": "Antes are unrelated to this idea."
            }
          },
          {
            "id": "pt_pos_q8_r2",
            "question": "Closing the action preflop means:",
            "options": [
              "You act last with no players left behind you",
              "You must raise",
              "You win the pot",
              "You are on the button"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — no one can raise after you.",
              "B": "You can call or fold too.",
              "C": "Closing action doesn't win the pot.",
              "D": "Button may not close if blinds remain."
            }
          }
        ]
      },
      {
        "id": "pt_pos_q9",
        "kind": "challenge",
        "concept": "squeeze",
        "question": "UTG opens, cutoff calls, you are on the button with A♣ 5♣. A squeeze is:",
        "options": [
          "Calling only",
          "A large re-raise to punish the open and call, often folding out weaker hands",
          "Checking the flop",
          "Showing your hand"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Flat call isn't a squeeze.",
          "B": "Correct — squeeze re-raises leverage fold equity against open + caller.",
          "C": "Flop hasn't happened.",
          "D": "Never show early."
        },
        "remediation": [
          {
            "id": "pt_pos_q9_r1",
            "question": "Squeezes work well from the button because:",
            "options": [
              "You may fold out the original raiser and caller",
              "You act first preflop",
              "You post a blind",
              "You always have a pair"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — fold equity from late position.",
              "B": "Button acts late preflop.",
              "C": "Button doesn't post blind.",
              "D": "Squeeze ranges are wider than only pairs."
            }
          },
          {
            "id": "pt_pos_q9_r2",
            "question": "A squeeze targets:",
            "options": [
              "Dead money from an open and one or more callers",
              "Only the river",
              "Showing down cheaply",
              "Posting antes"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — dead money in the middle.",
              "B": "Preflop move.",
              "C": "Squeeze is aggressive, not cheap showdown.",
              "D": "Antes add dead money but squeeze targets opens/calls."
            }
          }
        ]
      },
      {
        "id": "pt_pos_q10",
        "kind": "challenge",
        "concept": "multiway",
        "question": "On a wet flop K♥ T♥ 8♠, why is position especially valuable multiway?",
        "options": [
          "Fewer players means more bluffs work",
          "Later actors see how many opponents check or bet before deciding",
          "Board pairs always",
          "Blinds act last"
        ],
        "correctAnswer": 1,
        "explanations": {
          "A": "Multiway means more players, not fewer.",
          "B": "Correct — multiway pots amplify the value of seeing all actions first.",
          "C": "Board pairing is unrelated.",
          "D": "Blinds act early postflop."
        },
        "remediation": [
          {
            "id": "pt_pos_q10_r1",
            "question": "Multiway pot means:",
            "options": [
              "Three or more players saw the flop",
              "Heads-up only",
              "Everyone folded preflop",
              "Side pot only"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — multiple players contest the pot.",
              "B": "Heads-up is two players.",
              "C": "Someone must reach the flop.",
              "D": "Side pots are stack-related."
            }
          },
          {
            "id": "pt_pos_q10_r2",
            "question": "Acting last multiway helps you:",
            "options": [
              "Gauge strength from several checks or bets",
              "Skip paying the blinds",
              "See opponent hole cards",
              "Win without showdown always"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — more information with more actors.",
              "B": "Blinds still apply.",
              "C": "Hole cards stay hidden.",
              "D": "Still need best hand or folds."
            }
          }
        ]
      }
    ],
    "placementQuestions": [
      {
        "id": "pt_pos_p1",
        "concept": "utg",
        "question": "UTG is:",
        "options": [
          "First to act preflop among main seats",
          "The button",
          "The big blind",
          "Last to act"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Button is last.",
          "C": "BB acts last preflop.",
          "D": "UTG is early."
        }
      },
      {
        "id": "pt_pos_p2",
        "concept": "button",
        "question": "Best seat postflop:",
        "options": [
          "UTG",
          "SB",
          "Button",
          "BB only"
        ],
        "correctAnswer": 2,
        "explanations": {
          "A": "Early is weak postflop.",
          "B": "SB acts first postflop.",
          "C": "Correct.",
          "D": "BB acts early."
        }
      },
      {
        "id": "pt_pos_p3",
        "concept": "ip",
        "question": "In position means:",
        "options": [
          "Act last on the street",
          "Act first",
          "Have aces",
          "Post blind"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "That's OOP.",
          "C": "Hand strength unrelated.",
          "D": "Blinds unrelated."
        }
      },
      {
        "id": "pt_pos_p4",
        "concept": "open",
        "question": "UTG should open:",
        "options": [
          "Tighter than the button",
          "Every hand",
          "Only when on the button",
          "Never"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — early = tighter.",
          "B": "Too wide.",
          "C": "UTG isn't button.",
          "D": "UTG opens sometimes."
        }
      },
      {
        "id": "pt_pos_p5",
        "concept": "blinds",
        "question": "Small blind is usually:",
        "options": [
          "Half the big blind",
          "Double the big blind",
          "Zero",
          "Same as button"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "SB is smaller.",
          "C": "SB posts.",
          "D": "Button different role."
        }
      },
      {
        "id": "pt_pos_p6",
        "concept": "steal",
        "question": "Steal attempts often come from:",
        "options": [
          "Late position",
          "UTG always",
          "Folded hands",
          "Showdown"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "UTG has players behind.",
          "C": "Folded can't steal.",
          "D": "Showdown is end."
        }
      },
      {
        "id": "pt_pos_p7",
        "concept": "flop_act",
        "question": "Flop action starts:",
        "options": [
          "Left of button",
          "On the river",
          "With dealer",
          "Random"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "River is later.",
          "C": "Dealer doesn't act.",
          "D": "Order fixed."
        }
      },
      {
        "id": "pt_pos_p8",
        "concept": "bb_defend",
        "question": "BB defends wider partly because:",
        "options": [
          "Already invested in the pot",
          "Always has position",
          "Must call by rule",
          "Sees cards last"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — pot odds.",
          "B": "BB usually OOP.",
          "C": "Can fold.",
          "D": "Not last to see cards."
        }
      }
    ]
  },
  {
    "lessonId": "pt_pot_odds",
    "order": 4,
    "title": "Pot Odds & Expected Value",
    "subtitle": "When a call is mathematically justified",
    "topics": [
      "Pot odds",
      "Equity",
      "Breakeven",
      "Implied odds"
    ],
    "intro": [
      "Pot odds compare the size of the pot to the price of a call. If you must call $10 into a $40 pot, you are getting 4:1 — you need to win more than one time in five (20% equity) to break even on that call.",
      "Expected value (EV) extends this idea: multiply each outcome by its probability and sum. A +EV call loses often in the short run but profits over thousands of similar spots.",
      "Implied odds adjust for future chips you may win when you hit your draw. This lesson connects raw math to Hold'em decisions — flush draws, gutshots, and river calls."
    ],
    "questions": [
      {
        "id": "pt_po_q1",
        "kind": "standard",
        "concept": "pot_odds_def",
        "question": "Pot is $80, opponent bets $20. You call $20. Total pot you can win is:",
        "options": [
          "$80",
          "$100",
          "$120",
          "$20"
        ],
        "correctAnswer": 2,
        "explanations": {
          "A": "$80 is pot before the bet only.",
          "B": "$100 ignores your call.",
          "C": "Correct — $80 + $20 bet + $20 call = $120.",
          "D": "$20 is only your call."
        },
        "remediation": [
          {
            "id": "pt_po_q1_r1",
            "question": "Pot $50, bet $25, you call $25. Total pot after your call:",
            "options": [
              "$75",
              "$100",
              "$25",
              "$50"
            ],
            "correctAnswer": 1,
            "explanations": {
              "A": "$75 is before your call.",
              "B": "Correct — $50 + $25 + $25 = $100.",
              "C": "$25 is your call.",
              "D": "$50 is starting pot."
            }
          },
          {
            "id": "pt_po_q1_r2",
            "question": "Calling $10 into $40 (before call) gives pot odds of:",
            "options": [
              "4:1 on your call",
              "10:1",
              "1:4",
              "Even money"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — risk $10 to win $40 = 4:1.",
              "B": "10:1 would need $100 pot.",
              "C": "1:4 inverts the ratio.",
              "D": "Even money is 1:1."
            }
          }
        ]
      },
      {
        "id": "pt_po_q2",
        "kind": "standard",
        "concept": "breakeven",
        "question": "Getting 3:1 pot odds, minimum break-even equity on a call?",
        "options": [
          "25%",
          "33%",
          "50%",
          "75%"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — call 1 to win 3+1=4, need 1/4 = 25%.",
          "B": "33% is roughly 2:1 pot odds.",
          "C": "50% is 1:1.",
          "D": "75% would be poor odds."
        },
        "remediation": [
          {
            "id": "pt_po_q2_r1",
            "question": "2:1 pot odds need break-even equity of:",
            "options": [
              "33%",
              "25%",
              "50%",
              "20%"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — 1/(2+1) ≈ 33%.",
              "B": "25% is 3:1.",
              "C": "50% is even.",
              "D": "20% is 4:1."
            }
          },
          {
            "id": "pt_po_q2_r2",
            "question": "4:1 pot odds need break-even equity of:",
            "options": [
              "20%",
              "25%",
              "40%",
              "80%"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — 1/5 = 20%.",
              "B": "25% is 3:1.",
              "C": "40% too high.",
              "D": "80% too high."
            }
          }
        ]
      },
      {
        "id": "pt_po_q3",
        "kind": "standard",
        "concept": "flush_draw",
        "question": "On the flop you have a flush draw (9 outs). Approximate equity to hit by the river?",
        "options": [
          "~35%",
          "~15%",
          "~50%",
          "~2%"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — rule of 4: 9×4 ≈ 36% by river.",
          "B": "15% is too low for 9 outs.",
          "C": "50% is an overestimate.",
          "D": "2% is far too low."
        },
        "remediation": [
          {
            "id": "pt_po_q3_r1",
            "question": "Rule of 4 on flop: 8 outs ≈ equity by river?",
            "options": [
              "32%",
              "16%",
              "8%",
              "64%"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — 8×4 = 32%.",
              "B": "16% is turn-only rough.",
              "C": "8% underestimates.",
              "D": "64% overestimates."
            }
          },
          {
            "id": "pt_po_q3_r2",
            "question": "9 outs on the turn (one card) ≈ equity:",
            "options": [
              "18%",
              "36%",
              "9%",
              "45%"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — rule of 2: 9×2 = 18%.",
              "B": "36% is two cards.",
              "C": "9% too low.",
              "D": "45% too high."
            }
          }
        ]
      },
      {
        "id": "pt_po_q4",
        "kind": "standard",
        "concept": "bad_call",
        "question": "Pot $100, bet $100, you have 30% equity. Calling is:",
        "options": [
          "-EV",
          "+EV",
          "Always correct",
          "0 EV always"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — need ~33% at 1:1 pot odds; 30% is short.",
          "B": "+EV would need equity above breakeven.",
          "C": "Not always correct.",
          "D": "Could be -EV."
        },
        "remediation": [
          {
            "id": "pt_po_q4_r1",
            "question": "Even-money pot odds need roughly:",
            "options": [
              "50% equity",
              "25%",
              "10%",
              "0%"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — 1:1 means win half the time.",
              "B": "25% is 3:1.",
              "C": "10% too low.",
              "D": "0% never profitable."
            }
          },
          {
            "id": "pt_po_q4_r2",
            "question": "If equity < pot-odds breakeven, call is:",
            "options": [
              "-EV long run (without implied odds)",
              "+EV always",
              "Mandatory",
              "Free"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — math says fold unless implied odds help.",
              "B": "Not +EV.",
              "C": "Fold often correct.",
              "D": "Calls cost chips."
            }
          }
        ]
      },
      {
        "id": "pt_po_q5",
        "kind": "standard",
        "concept": "implied_odds",
        "question": "Implied odds matter most when:",
        "options": [
          "You may win a large stack if you hit your draw",
          "Pot is tiny and stacks shallow",
          "You have the nuts already",
          "Board is paired"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — future bets inflate reward beyond current pot.",
          "B": "Shallow stacks limit implied odds.",
          "C": "Nuts don't need implied odds for a draw.",
          "D": "Paired board is a separate concern."
        },
        "remediation": [
          {
            "id": "pt_po_q5_r1",
            "question": "Deep stacks generally:",
            "options": [
              "Increase implied odds for draws",
              "Remove implied odds",
              "Mean fold every draw",
              "Change hand rankings"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — more chips to win when you hit.",
              "B": "Deep stacks increase implied odds.",
              "C": "Good draws still play.",
              "D": "Rankings unchanged."
            }
          },
          {
            "id": "pt_po_q5_r2",
            "question": "Set mining preflop needs:",
            "options": [
              "Implied odds — flop a set rarely but win big",
              "No callers",
              "50% equity preflop",
              "Shallow 10bb stacks only"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — ~12% flop set; profit from stacking opponent.",
              "B": "Callers help pot odds.",
              "C": "Pocket pair preflop equity is low.",
              "D": "Deep stacks needed."
            }
          }
        ]
      },
      {
        "id": "pt_po_q6",
        "kind": "standard",
        "concept": "ev_positive",
        "question": "+EV means:",
        "options": [
          "Profitable long run if repeated",
          "Wins every time",
          "Always feels good",
          "Same as pot odds"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — positive expected value over many trials.",
          "B": "Variance means losses happen.",
          "C": "Feelings mislead.",
          "D": "Pot odds help compute EV but differ."
        },
        "remediation": [
          {
            "id": "pt_po_q6_r1",
            "question": "60% equity all-in is:",
            "options": [
              "+EV if pot odds justify",
              "Always -EV",
              "0 EV",
              "Illegal"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — a favorite can be +EV.",
              "B": "Favorites are often +EV.",
              "C": "Not zero if edge exists.",
              "D": "Legal shove."
            }
          },
          {
            "id": "pt_po_q6_r2",
            "question": "Short-term results:",
            "options": [
              "Can diverge from EV due to variance",
              "Always match EV exactly",
              "Disprove EV in one hand",
              "Eliminate math"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — luck swings short samples.",
              "B": "Long run converges.",
              "C": "One hand doesn't disprove math.",
              "D": "Math still applies."
            }
          }
        ]
      },
      {
        "id": "pt_po_q7",
        "kind": "standard",
        "concept": "combo_draw",
        "question": "Flush draw plus open-ended straight draw has more equity than flush alone because:",
        "options": [
          "More outs improve your hand",
          "Same outs",
          "Fewer outs",
          "Board always pairs"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — combined outs (minus overlap) boost equity.",
          "B": "More outs, not same.",
          "C": "More outs, not fewer.",
          "D": "Board pairing unrelated."
        },
        "remediation": [
          {
            "id": "pt_po_q7_r1",
            "question": "15 clean outs on flop ≈:",
            "options": [
              "60% by river (rule of 4)",
              "15%",
              "30%",
              "100%"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — 15×4 = 60%.",
              "B": "15% is one-card rough.",
              "C": "30% underestimates.",
              "D": "Not guaranteed."
            }
          },
          {
            "id": "pt_po_q7_r2",
            "question": "Strong combo draw is:",
            "options": [
              "Many ways to improve",
              "Weak high card only",
              "Always fold",
              "Made full house"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — double draw equity.",
              "B": "Can be strong.",
              "C": "Often continue.",
              "D": "Not made yet."
            }
          }
        ]
      },
      {
        "id": "pt_po_q8",
        "kind": "standard",
        "concept": "reverse_implied",
        "question": "Reverse implied odds hurt when:",
        "options": [
          "Hitting your hand may lose a big pot (second best)",
          "You fold too much",
          "Pot is small",
          "You have the nuts"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — dominated draws like non-nut flush can lose stacks.",
          "B": "RIO is about losing big when you hit.",
          "C": "Small pot limits loss, not RIO definition.",
          "D": "Nuts don't have RIO problem."
        },
        "remediation": [
          {
            "id": "pt_po_q8_r1",
            "question": "Non-nut flush on paired board risks:",
            "options": [
              "Full house beating your flush",
              "Always winning",
              "Split only",
              "High card"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — paired board full houses possible.",
              "B": "Can lose to boat.",
              "C": "May lose entire pot.",
              "D": "Flush beats high card but loses to boat."
            }
          },
          {
            "id": "pt_po_q8_r2",
            "question": "Second-nut flush draw has:",
            "options": [
              "Reverse implied odds vs nut flush holder",
              "No risk",
              "Always +EV",
              "Extra outs"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — making flush may still lose.",
              "B": "Still risk.",
              "C": "Can be -EV.",
              "D": "Same flush outs roughly."
            }
          }
        ]
      },
      {
        "id": "pt_po_q9",
        "kind": "challenge",
        "concept": "river_call",
        "question": "Pot $200, villain shoves $100. You need 25% equity (call $100 to win $400). Villain's range is 30% bluffs you beat, 70% value you lose to. Call?",
        "options": [
          "+EV call — 30% > 25% breakeven",
          "Always fold",
          "Always call regardless",
          "Pot odds irrelevant"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — 30% equity exceeds 25% breakeven; bluff-catching is +EV.",
          "B": "Fold if bluffs insufficient.",
          "C": "Must compare to breakeven.",
          "D": "Pot odds central."
        },
        "remediation": [
          {
            "id": "pt_po_q9_r1",
            "question": "Bluff catching uses:",
            "options": [
              "Pot odds + range analysis",
              "Only feelings",
              "Always fold",
              "Card color"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — need enough bluffs in range.",
              "B": "Feelings mislead.",
              "C": "Sometimes call is correct.",
              "D": "Suits don't decide."
            }
          },
          {
            "id": "pt_po_q9_r2",
            "question": "Polarized river range often contains:",
            "options": [
              "Strong value or bluffs — fewer medium hands",
              "Always random",
              "Only nuts",
              "Only air"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — large bets often polarized.",
              "B": "Not random.",
              "C": "Includes bluffs too.",
              "D": "Value hands too."
            }
          }
        ]
      },
      {
        "id": "pt_po_q10",
        "kind": "challenge",
        "concept": "mdf",
        "question": "Pot $100, bet $50. Minimum defense frequency (MDF) to prevent auto-profit bluffs?",
        "options": [
          "67%",
          "33%",
          "50%",
          "100%"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — MDF = pot/(pot+bet) = 100/150 ≈ 67% continue.",
          "B": "33% is bet/pot, wrong formula.",
          "C": "50% not MDF here.",
          "D": "100% over-defends some spots."
        },
        "remediation": [
          {
            "id": "pt_po_q10_r1",
            "question": "MDF tells you:",
            "options": [
              "How often to continue vs bet to deny bluff profit",
              "Always fold",
              "Always raise",
              "Ignore pot size"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — balance defense vs pot odds.",
              "B": "Not always fold.",
              "C": "Raise is separate.",
              "D": "Pot size defines MDF."
            }
          },
          {
            "id": "pt_po_q10_r2",
            "question": "Folding more than MDF vs pure bluffs:",
            "options": [
              "Opponent profits betting any two",
              "You win more",
              "Math breaks",
              "Blinds increase"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — exploitable fold frequency.",
              "B": "You lose to bluffs.",
              "C": "Math still holds.",
              "D": "Blinds unrelated."
            }
          }
        ]
      }
    ],
    "placementQuestions": [
      {
        "id": "pt_po_p1",
        "concept": "pot_odds",
        "question": "Pot $60, bet $20, call $20. Total pot if call:",
        "options": [
          "$100",
          "$80",
          "$20",
          "$60"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "$60+$20+$20=$100.",
          "B": "Missing your call.",
          "C": "Call only.",
          "D": "Pot before bet."
        }
      },
      {
        "id": "pt_po_p2",
        "concept": "breakeven",
        "question": "4:1 pot odds need ~equity:",
        "options": [
          "20%",
          "25%",
          "50%",
          "80%"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "1/5=20%.",
          "B": "25% is 3:1.",
          "C": "50% is 1:1.",
          "D": "Too high."
        }
      },
      {
        "id": "pt_po_p3",
        "concept": "outs",
        "question": "9 outs on flop ≈ river equity (rule of 4):",
        "options": [
          "36%",
          "18%",
          "9%",
          "72%"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "9×4=36%.",
          "B": "18% one card.",
          "C": "9% too low.",
          "D": "72% too high."
        }
      },
      {
        "id": "pt_po_p4",
        "concept": "ev",
        "question": "+EV means:",
        "options": [
          "Long-run profit",
          "Win always",
          "Fold always",
          "No math"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Variance exists.",
          "C": "Often call or raise.",
          "D": "Math defines EV."
        }
      },
      {
        "id": "pt_po_p5",
        "concept": "implied",
        "question": "Implied odds = future chips when:",
        "options": [
          "You hit your draw",
          "You fold",
          "Board pairs",
          "UTG opens"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "No future win if fold.",
          "C": "Separate issue.",
          "D": "Preflop."
        }
      },
      {
        "id": "pt_po_p6",
        "concept": "mdf",
        "question": "Pot $90 bet $30 MDF ≈",
        "options": [
          "75%",
          "33%",
          "50%",
          "10%"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "90/120=75%.",
          "B": "Wrong formula.",
          "C": "Not 50%.",
          "D": "Too low."
        }
      },
      {
        "id": "pt_po_p7",
        "concept": "rio",
        "question": "Reverse implied odds:",
        "options": [
          "Lose big when hit second best",
          "Always win when hit",
          "Free cards",
          "More outs"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Opposite of RIO.",
          "C": "Unrelated.",
          "D": "Outs same."
        }
      },
      {
        "id": "pt_po_p8",
        "concept": "call",
        "question": "Equity below pot odds breakeven → call is:",
        "options": [
          "-EV (without implied odds)",
          "+EV always",
          "Mandatory",
          "0 chips"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Usually fold.",
          "C": "Not mandatory.",
          "D": "Call costs chips."
        }
      }
    ]
  },
  {
    "lessonId": "pt_bluffing",
    "order": 5,
    "title": "Bluffing & Semi-Bluffs",
    "subtitle": "Fold equity, story consistency, and when aggression makes sense",
    "topics": [
      "Pure bluffs",
      "Semi-bluffs",
      "Fold equity",
      "Blockers"
    ],
    "intro": [
      "A bluff wins when a better hand folds. Pure bluffs rely entirely on fold equity — you have little chance to improve if called. Semi-bluffs bet with draws, combining fold equity with equity when called.",
      "Good bluffs tell a coherent story: your line should represent hands your opponent believes you could hold. Wet, scary boards favor bluffs; calling stations and multiway pots reduce bluff success.",
      "Bluffing is not random aggression — it is a calculated use of fold equity, blockers, and opponent tendencies. This lesson teaches when to fire, when to give up, and how semi-bluffs differ from pure air."
    ],
    "questions": [
      {
        "id": "pt_bl_q1",
        "kind": "standard",
        "concept": "pure_bluff",
        "question": "A pure bluff is:",
        "options": [
          "Betting with little equity if called, hoping opponent folds",
          "Betting only with the nuts",
          "Checking strong hands",
          "Calling every raise"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — fold equity is the primary win path.",
          "B": "Betting nuts is value, not bluff.",
          "C": "Checking strong is slow play.",
          "D": "Calling isn't bluffing."
        },
        "remediation": [
          {
            "id": "pt_bl_q1_r1",
            "question": "Pure bluff wins when:",
            "options": [
              "Opponent folds",
              "You hit on river always",
              "Board pairs",
              "You show cards"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — fold equity.",
              "B": "Hitting turns bluff into semi-bluff or value.",
              "C": "Pairing unrelated.",
              "D": "Showdown not required if fold."
            }
          },
          {
            "id": "pt_bl_q1_r2",
            "question": "Bluffing with zero fold equity is:",
            "options": [
              "Usually -EV",
              "Always +EV",
              "Required",
              "Same as value bet"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — if called always, air loses.",
              "B": "Need folds or draws.",
              "C": "Not required.",
              "D": "Value wants calls."
            }
          }
        ]
      },
      {
        "id": "pt_bl_q2",
        "kind": "standard",
        "concept": "semi_bluff",
        "question": "A semi-bluff is:",
        "options": [
          "Bet/raise with a draw that can improve if called",
          "Only checking draws",
          "Calling with nuts",
          "Showing cards early"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — fold equity plus draw equity.",
          "B": "Checking draws isn't semi-bluff.",
          "C": "Nuts is value.",
          "D": "Never show early."
        },
        "remediation": [
          {
            "id": "pt_bl_q2_r1",
            "question": "Flush draw betting the flop is often:",
            "options": [
              "Semi-bluff",
              "Pure value only",
              "Always fold",
              "Check always"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — can win now or hit flush.",
              "B": "Could be value if made.",
              "C": "Often continue.",
              "D": "Semi-bluff is aggressive option."
            }
          },
          {
            "id": "pt_bl_q2_r2",
            "question": "Semi-bluff beats pure bluff when called because:",
            "options": [
              "You have outs to improve",
              "Rules require it",
              "Pot shrinks",
              "Board freezes"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — equity when called.",
              "B": "Strategy not rule.",
              "C": "Pot may grow.",
              "D": "Cards still come."
            }
          }
        ]
      },
      {
        "id": "pt_bl_q3",
        "kind": "standard",
        "concept": "fold_equity",
        "question": "Fold equity is:",
        "options": [
          "The chance opponent folds to your bet",
          "Extra chips in blinds",
          "Your hand strength",
          "Pot odds only"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — probability of winning uncontested.",
          "B": "Blinds are dead money, not fold equity.",
          "C": "Strength helps but FE is about folds.",
          "D": "Pot odds differ."
        },
        "remediation": [
          {
            "id": "pt_bl_q3_r1",
            "question": "More fold equity when:",
            "options": [
              "Opponent's range is weak/capped",
              "Opponent never folds",
              "Multiway with callers",
              "You have nuts"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — weak ranges fold more.",
              "B": "No fold equity.",
              "C": "Multiway reduces FE.",
              "D": "Nuts wants call."
            }
          },
          {
            "id": "pt_bl_q3_r2",
            "question": "Bluff success needs:",
            "options": [
              "Opponent to fold enough",
              "Always best hand",
              "Board to pair",
              "Showdown"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct.",
              "B": "Bluffs often have weak hands.",
              "C": "Unrelated.",
              "D": "Fold ends hand."
            }
          }
        ]
      },
      {
        "id": "pt_bl_q4",
        "kind": "standard",
        "concept": "board_texture",
        "question": "Dry board (K♠ 7♦ 2♣) vs wet board (J♥ T♥ 9♠) for bluffing:",
        "options": [
          "Dry boards often favor bluffs — fewer draws call",
          "Wet boards always best for bluffs",
          "Texture irrelevant",
          "Only preflop matters"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — fewer credible calling hands on dry boards.",
          "B": "Wet boards have many draws that continue.",
          "C": "Texture matters greatly.",
          "D": "Postflop texture key."
        },
        "remediation": [
          {
            "id": "pt_bl_q4_r1",
            "question": "Wet coordinated boards:",
            "options": [
              "Give opponents more continuing hands",
              "Always fold everyone",
              "Mean no bets ever",
              "Only for checks"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — draws and pairs continue.",
              "B": "Rare everyone folds.",
              "C": "Still bet for value/semi-bluff.",
              "D": "Bets exist."
            }
          },
          {
            "id": "pt_bl_q4_r2",
            "question": "Dry ace-high flop:",
            "options": [
              "Often good c-bet bluff spot",
              "Never bluff",
              "Always check-raise",
              "Only call"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — misses many ranges.",
              "B": "Can bluff selectively.",
              "C": "Check-raise not default.",
              "D": "Can bet."
            }
          }
        ]
      },
      {
        "id": "pt_bl_q5",
        "kind": "standard",
        "concept": "story",
        "question": "A credible bluff story means:",
        "options": [
          "Your bets represent hands you could plausibly hold",
          "Any bet works equally",
          "Only bluff with nuts blocker",
          "Story doesn't matter"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — line must match value range.",
          "B": "Bad bluffs ignore story.",
          "C": "Blockers help but story is broader.",
          "D": "Story central."
        },
        "remediation": [
          {
            "id": "pt_bl_q5_r1",
            "question": "Triple-barrel bluff needs:",
            "options": [
              "Consistent story across streets",
              "Random sizing only",
              "Always nuts",
              "Checking river"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — each street builds narrative.",
              "B": "Sizing should make sense.",
              "C": "Bluff by definition not nuts.",
              "D": "River bet can bluff."
            }
          },
          {
            "id": "pt_bl_q5_r2",
            "question": "If you check flop and turn, river overbet bluff:",
            "options": [
              "Harder story — missed earlier value lines",
              "Always best bluff",
              "Illegal",
              "Automatic call"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — inconsistent lines get called.",
              "B": "Sometimes works vs tight players.",
              "C": "Legal.",
              "D": "Opponents may call."
            }
          }
        ]
      },
      {
        "id": "pt_bl_q6",
        "kind": "standard",
        "concept": "blockers",
        "question": "Bluffing with A♠ on three-spade board helps because:",
        "options": [
          "You block nut flush combos opponent may hold",
          "Ace always wins",
          "Spades irrelevant",
          "Blockers never matter"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — fewer nut flushes in villain range.",
          "B": "You may not have flush.",
          "C": "Spades matter.",
          "D": "Blockers help bluff selection."
        },
        "remediation": [
          {
            "id": "pt_bl_q6_r1",
            "question": "Blockers reduce:",
            "options": [
              "Combos of strong hands villain can have",
              "Your fold equity always",
              "Pot size",
              "Blind size"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — combo counting.",
              "B": "Can increase bluff success.",
              "C": "Unrelated.",
              "D": "Unrelated."
            }
          },
          {
            "id": "pt_bl_q6_r2",
            "question": "Nut flush blocker on river bluff:",
            "options": [
              "Makes bluff more credible vs flush-calling range",
              "Forces always fold",
              "Means you have flush",
              "Illegal"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — villain less likely to have nuts.",
              "B": "Not always.",
              "C": "You might not have made flush.",
              "D": "Legal."
            }
          }
        ]
      },
      {
        "id": "pt_bl_q7",
        "kind": "standard",
        "concept": "give_up",
        "question": "When should you abandon a bluff?",
        "options": [
          "Turn/river when opponent shows strength and story breaks",
          "Never give up",
          "Always fire three barrels",
          "Only on preflop"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — good players know when to stop.",
          "B": "Stubborn bluffs burn chips.",
          "C": "Three barrels not mandatory.",
          "D": "Bluffs happen postflop."
        },
        "remediation": [
          {
            "id": "pt_bl_q7_r1",
            "question": "Opponent raises flop — with air you often:",
            "options": [
              "Re-evaluate — raise may mean strength",
              "Always shove",
              "Must call always",
              "Show cards"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — fold equity gone, equity low.",
              "B": "Bad with air.",
              "C": "Air often folds.",
              "D": "No show mid-hand."
            }
          },
          {
            "id": "pt_bl_q7_r2",
            "question": "Giving up on bluff saves:",
            "options": [
              "Chips you'd lose if called down",
              "Nothing",
              "Always the pot",
              "Blinds only"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — stop-loss on bluff lines.",
              "B": "Saves real money.",
              "C": "Pot already lost if they won't fold.",
              "D": "More than blinds."
            }
          }
        ]
      },
      {
        "id": "pt_bl_q8",
        "kind": "standard",
        "concept": "station",
        "question": "Against a calling station you should:",
        "options": [
          "Bluff less, value bet more",
          "Bluff more",
          "Always triple barrel air",
          "Never bet"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — low fold equity vs stations.",
          "B": "They call — bluffs fail.",
          "C": "Air loses money.",
          "D": "Value bet thick."
        },
        "remediation": [
          {
            "id": "pt_bl_q8_r1",
            "question": "Calling station trait:",
            "options": [
              "Calls too often with medium hands",
              "Folds everything",
              "Only raises nuts",
              "Never sees flop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — low fold frequency.",
              "B": "Opposite of station.",
              "C": "Stations call, not raise.",
              "D": "They see flops."
            }
          },
          {
            "id": "pt_bl_q8_r2",
            "question": "Vs station, thin value bets:",
            "options": [
              "More profitable than bluffs",
              "Always -EV",
              "Impossible",
              "Same as bluff"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — extract from calls.",
              "B": "Thin value good vs callers.",
              "C": "Very possible.",
              "D": "Bluffs worse."
            }
          }
        ]
      },
      {
        "id": "pt_bl_q9",
        "kind": "challenge",
        "concept": "double_barrel",
        "question": "You c-bet flop, get called. Turn brings blank. You have 6-high air. Best approach often:",
        "options": [
          "Selective turn barrel if villain range capped and card scary to them",
          "Always shove",
          "Always check and give up",
          "Show your hand"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — second barrel when fold equity exists and story fits.",
          "B": "Shove too large often.",
          "C": "Sometimes barrel is good.",
          "D": "Illegal."
        },
        "remediation": [
          {
            "id": "pt_bl_q9_r1",
            "question": "Second barrel works when:",
            "options": [
              "Turn card hurts caller's range",
              "You have nuts always",
              "Multiway five players",
              "Never"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — range pressure.",
              "B": "Bluff not nuts.",
              "C": "Multiway bad for bluffs.",
              "D": "Sometimes works."
            }
          },
          {
            "id": "pt_bl_q9_r2",
            "question": "Blank turn for caller means:",
            "options": [
              "Their range unchanged — bluff less often",
              "Always fold for them",
              "You win pot",
              "Board dead"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — less fold equity than scare card.",
              "B": "They still have range.",
              "C": "Not automatic.",
              "D": "Cards still deal."
            }
          }
        ]
      },
      {
        "id": "pt_bl_q10",
        "kind": "challenge",
        "concept": "merge",
        "question": "Betting medium strength for protection/thin value on scary river is:",
        "options": [
          "Not a bluff — value/protection bet",
          "Pure bluff always",
          "Same as check-fold",
          "Illegal"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — wants calls from worse, folds from better sometimes.",
          "B": "Medium hands aren't pure bluff.",
          "C": "Different from check-fold.",
          "D": "Legal."
        },
        "remediation": [
          {
            "id": "pt_bl_q10_r1",
            "question": "Thin value differs from bluff because:",
            "options": [
              "Happy getting called by worse hands",
              "Needs folds only",
              "Always with air",
              "Only preflop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — value wants calls.",
              "B": "Bluff needs folds.",
              "C": "Value has showdown value.",
              "D": "Postflop too."
            }
          },
          {
            "id": "pt_bl_q10_r2",
            "question": "Merged bet can:",
            "options": [
              "Get called by worse and fold out some better",
              "Only win by fold",
              "Never get called",
              "Skip showdown"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — middle outcome.",
              "B": "Value wants calls too.",
              "C": "Gets called often.",
              "D": "Showdown possible."
            }
          }
        ]
      }
    ],
    "placementQuestions": [
      {
        "id": "pt_bl_p1",
        "concept": "pure",
        "question": "Pure bluff:",
        "options": [
          "Bets hoping for fold with little equity",
          "Only with nuts",
          "Checks strong",
          "Calls raises"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Value.",
          "C": "Slow play.",
          "D": "Not bluff."
        }
      },
      {
        "id": "pt_bl_p2",
        "concept": "semi",
        "question": "Semi-bluff:",
        "options": [
          "Draw that can improve if called",
          "Check only",
          "Nuts call",
          "Show early"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Passive.",
          "C": "Value.",
          "D": "No."
        }
      },
      {
        "id": "pt_bl_p3",
        "concept": "fe",
        "question": "Fold equity:",
        "options": [
          "Chance foe folds",
          "Blind size",
          "Hand rank",
          "Pot odds"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Dead money.",
          "C": "Different.",
          "D": "Different."
        }
      },
      {
        "id": "pt_bl_p4",
        "concept": "dry",
        "question": "Dry board bluffing:",
        "options": [
          "Often better — fewer calls",
          "Always worse",
          "Irrelevant",
          "Preflop only"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Dry helps bluffs.",
          "C": "Matters.",
          "D": "Postflop."
        }
      },
      {
        "id": "pt_bl_p5",
        "concept": "story",
        "question": "Credible bluff:",
        "options": [
          "Represents plausible hands",
          "Any bet same",
          "Only nuts",
          "No story"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Bad bluffs.",
          "C": "Value.",
          "D": "Story matters."
        }
      },
      {
        "id": "pt_bl_p6",
        "concept": "blocker",
        "question": "Nut blocker helps bluff by:",
        "options": [
          "Reducing nut combos foe holds",
          "Always winning",
          "Irrelevant",
          "Shrinking pot"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Not always.",
          "C": "Matters.",
          "D": "No."
        }
      },
      {
        "id": "pt_bl_p7",
        "concept": "station",
        "question": "Vs calling station:",
        "options": [
          "Value more, bluff less",
          "Bluff more",
          "Triple air",
          "Never bet"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "They call.",
          "C": "Loses.",
          "D": "Value exists."
        }
      },
      {
        "id": "pt_bl_p8",
        "concept": "give_up",
        "question": "Give up bluff when:",
        "options": [
          "Story breaks / no fold equity",
          "Never",
          "Always barrel 3x",
          "Preflop only"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Burns chips.",
          "C": "Not always.",
          "D": "Postflop."
        }
      }
    ]
  },
  {
    "lessonId": "pt_ranges",
    "order": 6,
    "title": "Range Thinking",
    "subtitle": "Hands opponents can have — not just the one you put them on",
    "topics": [
      "Range thinking",
      "Polarized vs merged",
      "Range advantage",
      "Capped ranges"
    ],
    "intro": [
      "Instead of guessing one exact hand, strong players assign opponents a range — all combinations consistent with their actions. Preflop raises, calls, and postflop lines narrow that range street by street.",
      "Polarized ranges contain very strong hands and bluffs, with few medium-strength hands. Merged ranges include strong, medium, and some weak hands together — common in small bets and protected checks.",
      "Range advantage means your range hits a given board better than your opponent's on average. Nut advantage is who holds the strongest possible hands more often. These ideas drive c-bet frequency, bet sizing, and defense."
    ],
    "questions": [
      {
        "id": "pt_rng_q1",
        "kind": "standard",
        "concept": "range_def",
        "question": "A 'range' in poker is:",
        "options": [
          "Every hand villain might hold given their actions",
          "Only pocket aces",
          "The board only",
          "Your single best guess"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — a set of possible holdings.",
          "B": "AA is one combo in a range.",
          "C": "Board is separate.",
          "D": "One hand is too narrow."
        },
        "remediation": [
          {
            "id": "pt_rng_q1_r1",
            "question": "Ranges narrow when:",
            "options": [
              "Opponent takes stronger lines (raises, big bets)",
              "Everyone checks preflop forever",
              "Board is undealt",
              "Hand hasn't started"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — aggressive action removes weak hands.",
              "B": "No action doesn't narrow much.",
              "C": "No board yet is preflop ranges.",
              "D": "Hand must start first."
            }
          },
          {
            "id": "pt_rng_q1_r2",
            "question": "Thinking in ranges helps because:",
            "options": [
              "Single-hand guesses are often wrong",
              "Dealer always knows cards",
              "Pot odds disappear",
              "Blinds don't matter"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — distributions beat one-hand poker.",
              "B": "Dealer doesn't play.",
              "C": "Pot odds remain.",
              "D": "Blinds still matter."
            }
          }
        ]
      },
      {
        "id": "pt_rng_q2",
        "kind": "standard",
        "concept": "polarized",
        "question": "Polarized betting range contains mostly:",
        "options": [
          "Nuts and bluffs, few medium hands",
          "Only medium pairs",
          "Random any two cards always",
          "Folded hands"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — strong value plus air, not many middling hands.",
          "B": "Medium pairs are merged territory.",
          "C": "Not random — structured.",
          "D": "Folded hands aren't in range."
        },
        "remediation": [
          {
            "id": "pt_rng_q2_r1",
            "question": "Large river overbet is often:",
            "options": [
              "Polarized",
              "Merged with only weak hands",
              "Empty range",
              "Only high card"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — nuts or bluff.",
              "B": "Merged includes medium value.",
              "C": "Empty isn't betting.",
              "D": "High card alone isn't a range type."
            }
          },
          {
            "id": "pt_rng_q2_r2",
            "question": "Polarized means two poles:",
            "options": [
              "Very strong and weak bluffs",
              "Only draws",
              "Only sets",
              "Only checks"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — strong vs air.",
              "B": "Draws may be semi-bluffs elsewhere.",
              "C": "Sets are strong pole only.",
              "D": "Checks aren't a range composition."
            }
          }
        ]
      },
      {
        "id": "pt_rng_q3",
        "kind": "standard",
        "concept": "merged",
        "question": "Merged range includes:",
        "options": [
          "Strong, medium, and some weak hands together",
          "Only bluffs",
          "Only the nuts",
          "No hands"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — wide mix, hard to exploit with one hand type.",
          "B": "Bluffs only is polarized.",
          "C": "Nuts only is too narrow.",
          "D": "Ranges always have hands."
        },
        "remediation": [
          {
            "id": "pt_rng_q3_r1",
            "question": "Small flop c-bet often uses:",
            "options": [
              "Merged range — many hands for protection/value",
              "Only 72o bluffs",
              "No range at all",
              "Only river bluffs"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — small bets include medium strength.",
              "B": "72o alone isn't a strategy.",
              "C": "Always a range.",
              "D": "Flop not river only."
            }
          },
          {
            "id": "pt_rng_q3_r2",
            "question": "Merged betting is harder to play against because:",
            "options": [
              "You face both value and medium hands",
              "Opponent shows cards first",
              "Pot disappears",
              "Rules change"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — can't assume nuts or air only.",
              "B": "Show order doesn't define merge.",
              "C": "Pot remains.",
              "D": "Rules fixed."
            }
          }
        ]
      },
      {
        "id": "pt_rng_q4",
        "kind": "standard",
        "concept": "range_adv",
        "question": "Range advantage on a board means:",
        "options": [
          "Your overall range connects better than opponent's",
          "You always have the nuts",
          "Board is empty",
          "Blinds are bigger"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — more strong combos in your range on average.",
          "B": "Not every combo is nuts.",
          "C": "Board has cards.",
          "D": "Blinds unrelated."
        },
        "remediation": [
          {
            "id": "pt_rng_q4_r1",
            "question": "Preflop raiser often has range advantage on:",
            "options": [
              "High dry boards like A-K-2 rainbow",
              "Low connected boards favoring callers' suited hands",
              "Mucked boards",
              "No flop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — raiser has more big cards.",
              "B": "Low connected favors defender ranges.",
              "C": "Board must exist.",
              "D": "Flop needed for board advantage."
            }
          },
          {
            "id": "pt_rng_q4_r2",
            "question": "Nut advantage means:",
            "options": [
              "Your range holds the nuts more often",
              "You post blinds",
              "You fold more",
              "Rake is lower"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — who has strongest possible hands.",
              "B": "Blinds unrelated.",
              "C": "Folding isn't advantage.",
              "D": "Rake separate."
            }
          }
        ]
      },
      {
        "id": "pt_rng_q5",
        "kind": "standard",
        "concept": "capped",
        "question": "A 'capped' range lacks:",
        "options": [
          "The strongest possible hands on this line",
          "Any pairs",
          "All bluffs",
          "Community cards"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — e.g. call-call line rarely has nuts.",
          "B": "Capped can still have pairs.",
          "C": "Bluffs may remain.",
          "D": "Board exists separately."
        },
        "remediation": [
          {
            "id": "pt_rng_q5_r1",
            "question": "Opponent call-call-call on wet board is often:",
            "options": [
              "Capped — rarely the nuts",
              "Always the nuts",
              "Empty",
              "Dealer range"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — passive line removes nut combos.",
              "B": "Passive lines cap range.",
              "C": "Still has some hands.",
              "D": "Dealer doesn't play."
            }
          },
          {
            "id": "pt_rng_q5_r2",
            "question": "Bluff more vs capped range because:",
            "options": [
              "Strong hands less likely to call/raise",
              "They always have quads",
              "Pot is illegal",
              "You must check"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — fewer monsters defend.",
              "B": "Quads unlikely in capped range.",
              "C": "Pot legal.",
              "D": "Bluffing optional but good."
            }
          }
        ]
      },
      {
        "id": "pt_rng_q6",
        "kind": "standard",
        "concept": "narrow",
        "question": "Each street of action generally:",
        "options": [
          "Narrows opponent ranges",
          "Widens ranges to all cards",
          "Removes the deck",
          "Changes hand rankings"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — lines eliminate inconsistent hands.",
          "B": "Ranges shrink with info.",
          "C": "Deck remains.",
          "D": "Rankings fixed."
        },
        "remediation": [
          {
            "id": "pt_rng_q6_r1",
            "question": "Raise on turn removes from range:",
            "options": [
              "Many weak hands and some medium",
              "Only aces",
              "Nothing",
              "The button"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — aggression filters weak holdings.",
              "B": "Not only aces — many hands.",
              "C": "Something always removed.",
              "D": "Button stays."
            }
          },
          {
            "id": "pt_rng_q6_r2",
            "question": "Check-call-check often indicates:",
            "options": [
              "Medium strength, capped top",
              "Always nut flush",
              "No hand ever",
              "Fold preflop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — passive medium lines.",
              "B": "Nuts usually bet for value.",
              "C": "Always some hand type.",
              "D": "Reached postflop."
            }
          }
        ]
      },
      {
        "id": "pt_rng_q7",
        "kind": "standard",
        "concept": "combo",
        "question": "AA on A-K-5 flop is strong partly because:",
        "options": [
          "Many villain combos miss while yours connects",
          "Board is low only",
          "You have zero pair",
          "Ranges don't matter"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — raiser range hits ace; caller range misses more.",
          "B": "Board has ace and king.",
          "C": "You have top set/trips possible.",
          "D": "Ranges define this edge."
        },
        "remediation": [
          {
            "id": "pt_rng_q7_r1",
            "question": "Combo counting helps because:",
            "options": [
              "Some hands have more combinations than others",
              "All hands have one combo",
              "Board has hole cards",
              "Dealer counts for you"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — AA has 6 combos, AK suited has 4, etc.",
              "B": "Hands differ in combo count.",
              "C": "Hole cards aren't on board.",
              "D": "You count combos."
            }
          },
          {
            "id": "pt_rng_q7_r2",
            "question": "Unpaired hands like AK have:",
            "options": [
              "More total combos than AA pairs",
              "Zero combos",
              "Same as 72o always",
              "Only one combo"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — 16 combos unpaired vs 6 for AA.",
              "B": "All hands have combos.",
              "C": "72o has 12 combos — different.",
              "D": "Unpaired has 16 max."
            }
          }
        ]
      },
      {
        "id": "pt_rng_q8",
        "kind": "standard",
        "concept": "balance",
        "question": "Balanced range means:",
        "options": [
          "Mix of value and bluffs so opponents can't exploit easily",
          "Only bluffing",
          "Only checking nuts",
          "Showing cards early"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — appropriate value/bluff ratio for size and board.",
          "B": "Pure bluffs are unbalanced alone.",
          "C": "Checking nuts loses value.",
          "D": "Don't show early."
        },
        "remediation": [
          {
            "id": "pt_rng_q8_r1",
            "question": "If you never bluff, opponents can:",
            "options": [
              "Fold to your big bets easily",
              "Always call profitably",
              "Win every pot",
              "Change rankings"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — exploit by overfolding.",
              "B": "They lose when you have value.",
              "C": "Not every pot.",
              "D": "Rankings fixed."
            }
          },
          {
            "id": "pt_rng_q8_r2",
            "question": "Balance matters most vs:",
            "options": [
              "Thinking opponents who adjust",
              "Nobody ever",
              "Folded players",
              "Dead cards"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — good players exploit patterns.",
              "B": "Always some relevance.",
              "C": "Folded players don't act.",
              "D": "Dead cards irrelevant."
            }
          }
        ]
      },
      {
        "id": "pt_rng_q9",
        "kind": "challenge",
        "concept": "polarized_river",
        "question": "Pot $100, you overbet $150 river. Polarized range most likely includes:",
        "options": [
          "Nuts and bluffs, not many second-pair hands",
          "Only second pair",
          "Only underpairs",
          "Folded range"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — big size polarizes value and air.",
          "B": "Second pair usually smaller bet or check.",
          "C": "Underpairs rarely overbet for value.",
          "D": "Folded isn't betting."
        },
        "remediation": [
          {
            "id": "pt_rng_q9_r1",
            "question": "Overbet polarized — opponent with medium hand should often:",
            "options": [
              "Fold more than vs small bet",
              "Always raise",
              "Always call",
              "Muck preflop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — medium loses to value, doesn't beat bluffs enough.",
              "B": "Raise risky vs nuts.",
              "C": "Calling overbet with medium is often bad.",
              "D": "Already on river."
            }
          },
          {
            "id": "pt_rng_q9_r2",
            "question": "Polarized sizing tells opponent:",
            "options": [
              "You are rarely medium strength",
              "You always have 72o",
              "Board is blank",
              "Side pot forming"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — big bets skew strong or bluff.",
              "B": "72o may bluff but not always.",
              "C": "Board independent.",
              "D": "Side pots stack-related."
            }
          }
        ]
      },
      {
        "id": "pt_rng_q10",
        "kind": "challenge",
        "concept": "range_vs_hand",
        "question": "UTG opens, you 3-bet from button, UTG calls. A-A-7 flop — your range advantage mainly comes from:",
        "options": [
          "More AA, AK, AQ combos in your 3-bet range",
          "UTG having only 72o",
          "Board being low",
          "Blinds posting"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — 3-bettor range is stronger and hits ace-high boards.",
          "B": "UTG opens tight, not only 72o.",
          "C": "Ace-high isn't low.",
          "D": "Blinds unrelated."
        },
        "remediation": [
          {
            "id": "pt_rng_q10_r1",
            "question": "3-bettor range vs caller on A-high flop:",
            "options": [
              "3-bettor often has more strong ace-x",
              "Caller always has nuts",
              "Ranges identical",
              "No advantage possible"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — 3-bet range is weighted to big aces.",
              "B": "Caller has some aces but capped.",
              "C": "Ranges differ.",
              "D": "Advantage exists on some boards."
            }
          },
          {
            "id": "pt_rng_q10_r2",
            "question": "Range vs hand thinking means:",
            "options": [
              "Compare your whole range to theirs, not one hand",
              "Ignore all actions",
              "Only play one combo",
              "Dealer decides winner"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — equity of ranges matters.",
              "B": "Actions define ranges.",
              "C": "Play a strategy across combos.",
              "D": "Best hand wins."
            }
          }
        ]
      }
    ],
    "placementQuestions": [
      {
        "id": "pt_rng_p1",
        "concept": "range",
        "question": "Range is:",
        "options": [
          "Set of possible hands",
          "One guess only",
          "Board only",
          "Rake"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Too narrow.",
          "C": "Separate.",
          "D": "House fee."
        }
      },
      {
        "id": "pt_rng_p2",
        "concept": "polar",
        "question": "Polarized:",
        "options": [
          "Strong + bluffs",
          "Only medium",
          "Empty",
          "Folded"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "That's merged-ish.",
          "C": "Ranges have hands.",
          "D": "Not active."
        }
      },
      {
        "id": "pt_rng_p3",
        "concept": "merge",
        "question": "Merged range has:",
        "options": [
          "Strong, medium, weak mix",
          "Only nuts",
          "No hands",
          "Only bluffs"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Too narrow.",
          "C": "Always hands.",
          "D": "Polarized bluff pole."
        }
      },
      {
        "id": "pt_rng_p4",
        "concept": "adv",
        "question": "Range advantage:",
        "options": [
          "Your range hits board better",
          "Always nuts",
          "No board",
          "Bigger blinds"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Not every hand.",
          "C": "Need board.",
          "D": "Unrelated."
        }
      },
      {
        "id": "pt_rng_p5",
        "concept": "cap",
        "question": "Capped range lacks:",
        "options": [
          "Top of range strength",
          "Any cards",
          "Bluffs always",
          "Deck"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Still has hands.",
          "C": "May bluff.",
          "D": "Deck remains."
        }
      },
      {
        "id": "pt_rng_p6",
        "concept": "narrow",
        "question": "Action each street:",
        "options": [
          "Narrows ranges",
          "Widens to all cards",
          "Removes deck",
          "Changes ranks"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Opposite.",
          "C": "Deck stays.",
          "D": "Fixed."
        }
      },
      {
        "id": "pt_rng_p7",
        "concept": "combo",
        "question": "AA has how many combos?",
        "options": [
          "6",
          "16",
          "1",
          "12"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — pairs.",
          "B": "Unpaired max.",
          "C": "More than one.",
          "D": "72o has 12."
        }
      },
      {
        "id": "pt_rng_p8",
        "concept": "balance",
        "question": "Balanced range mixes:",
        "options": [
          "Value and bluffs",
          "Only checks",
          "Only folds",
          "Dead cards"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Incomplete.",
          "C": "Incomplete.",
          "D": "Not in play."
        }
      }
    ]
  },
  {
    "lessonId": "pt_postflop",
    "order": 7,
    "title": "Postflop Strategy",
    "subtitle": "C-bets, board texture, and value versus bluff",
    "topics": [
      "Continuation bets",
      "Board texture",
      "Value vs bluff",
      "Barreling"
    ],
    "intro": [
      "A continuation bet (c-bet) is when the preflop aggressor bets the flop. It leverages range advantage and fold equity — opponents who flat-called preflop often miss low and medium boards.",
      "Board texture describes how coordinated or dry the flop is. Wet boards (flush draws, straight draws, paired cards) connect with more ranges and demand careful sizing and frequency. Dry boards favor small c-bets with high frequency.",
      "Every postflop bet is either for value (wanting calls from worse) or as a bluff (wanting folds from better). Mixed strategies use both — and the best players choose sizes and frequencies that keep opponents guessing while exploiting board and range factors."
    ],
    "questions": [
      {
        "id": "pt_pf_q1",
        "kind": "standard",
        "concept": "cbet_def",
        "question": "A continuation bet (c-bet) is:",
        "options": [
          "Preflop raise followed by flop bet by same player",
          "Big blind check only",
          "River show without betting",
          "Posting antes"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — aggressor continues story on flop.",
          "B": "BB check isn't c-bet definition.",
          "C": "Showdown follows betting.",
          "D": "Antes aren't c-bets."
        },
        "remediation": [
          {
            "id": "pt_pf_q1_r1",
            "question": "Preflop raiser bets flop — that's a:",
            "options": [
              "C-bet",
              "Slow play only",
              "Muck",
              "New deal"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — classic c-bet.",
              "B": "Can be value or bluff, not only slow play.",
              "C": "Muck is surrender.",
              "D": "Same hand continues."
            }
          },
          {
            "id": "pt_pf_q1_r2",
            "question": "C-bet uses:",
            "options": [
              "Preflop initiative and often range edge",
              "Only seven-deuce",
              "Forced check rule",
              "Side pot math only"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — initiative plus fold equity.",
              "B": "Any hand can c-bet situationally.",
              "C": "No forced check.",
              "D": "Side pots separate topic."
            }
          }
        ]
      },
      {
        "id": "pt_pf_q2",
        "kind": "standard",
        "concept": "dry_board",
        "question": "Dry flop K♠ 7♦ 2♣ is:",
        "options": [
          "Hard for callers to connect — favors c-bets",
          "Wet with many draws",
          "Paired twice",
          "Always checks through"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — few draws, raiser range hits king often.",
          "B": "Wet boards have many draws.",
          "C": "Only one pair on board.",
          "D": "Can bet or check."
        },
        "remediation": [
          {
            "id": "pt_pf_q2_r1",
            "question": "Dry boards often get:",
            "options": [
              "Small c-bets at high frequency",
              "Huge bluffs only",
              "No betting ever",
              "Automatic fold"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — cheap fold equity.",
              "B": "Not only huge bluffs.",
              "C": "Betting common.",
              "D": "Many calls/folds possible."
            }
          },
          {
            "id": "pt_pf_q2_r2",
            "question": "Rainbow flop means:",
            "options": [
              "Three different suits — no flush draw yet",
              "Three spades",
              "Four cards",
              "Paired board"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — no one-card flush draw.",
              "B": "Three same suit is monotone.",
              "C": "Flop is three cards.",
              "D": "Pair is separate texture."
            }
          }
        ]
      },
      {
        "id": "pt_pf_q3",
        "kind": "standard",
        "concept": "wet_board",
        "question": "Wet flop J♥ T♥ 9♠ is:",
        "options": [
          "Connected with straight and flush draws",
          "Dry ace-high",
          "Rainbow rags only",
          "Unplayable always"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — many draws and made hands possible.",
          "B": "Ace-high dry is different.",
          "C": "Two hearts = flush draws.",
          "D": "Playable with strategy."
        },
        "remediation": [
          {
            "id": "pt_pf_q3_r1",
            "question": "On wet boards c-bet:",
            "options": [
              "Less often and sometimes bigger for protection",
              "Always 100% tiny",
              "Never",
              "Only preflop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — more caller equity, selective betting.",
              "B": "Not always tiny.",
              "C": "Still c-bet sometimes.",
              "D": "Postflop concept."
            }
          },
          {
            "id": "pt_pf_q3_r2",
            "question": "Wet boards favor:",
            "options": [
              "Hands with draws and strong made hands",
              "Only 72o",
              "Folded players",
              "Dealer"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — connectivity helps many ranges.",
              "B": "72o rarely connects.",
              "C": "Folded out.",
              "D": "Dealer doesn't play."
            }
          }
        ]
      },
      {
        "id": "pt_pf_q4",
        "kind": "standard",
        "concept": "value_bet",
        "question": "Value bet aims to:",
        "options": [
          "Get called by worse hands",
          "Force folds from better always",
          "Check every street",
          "Split pot"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — thinner value wants calls from second-best.",
          "B": "That's bluff goal.",
          "C": "Value bets bet.",
          "D": "Split needs tie."
        },
        "remediation": [
          {
            "id": "pt_pf_q4_r1",
            "question": "Top pair good kicker on dry flop often:",
            "options": [
              "Value bet",
              "Pure bluff only",
              "Must fold",
              "Muck"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — likely best, wants calls.",
              "B": "Has showdown value.",
              "C": "Strong hand continues.",
              "D": "Showdown later."
            }
          },
          {
            "id": "pt_pf_q4_r2",
            "question": "Value bet sizing on dry board often:",
            "options": [
              "Smaller to get called by worse",
              "All-in always",
              "Zero",
              "Only on river"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — small bets get calls from middling hands.",
              "B": "Overbet can fold out worse.",
              "C": "Bets cost chips.",
              "D": "Value on all streets possible."
            }
          }
        ]
      },
      {
        "id": "pt_pf_q5",
        "kind": "standard",
        "concept": "bluff_bet",
        "question": "Bluff bet wants:",
        "options": [
          "Folds from better hands",
          "Calls from worse",
          "Showdown only",
          "Ante increase"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — fold equity is the win condition.",
          "B": "Calls from worse is value.",
          "C": "Bluffs avoid showdown.",
          "D": "Antes separate."
        },
        "remediation": [
          {
            "id": "pt_pf_q5_r1",
            "question": "Missed c-bet bluff on scary turn means:",
            "options": [
              "Check flop, bet turn when card favors your story",
              "Bet flop always",
              "Fold preflop",
              "Show cards"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — delayed bluff on scare card.",
              "B": "Missed c-bet skipped flop bet.",
              "C": "Already postflop.",
              "D": "Don't show early."
            }
          },
          {
            "id": "pt_pf_q5_r2",
            "question": "Bluff c-bet on dry board works when:",
            "options": [
              "Opponent range misses and folds often",
              "They always have top pair",
              "Pot is zero",
              "You have nuts"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — fold equity on dry misses.",
              "B": "Top pair calls.",
              "C": "Pot exists.",
              "D": "Nuts is value."
            }
          }
        ]
      },
      {
        "id": "pt_pf_q6",
        "kind": "standard",
        "concept": "texture_change",
        "question": "Turn brings third heart on two-heart flop. This:",
        "options": [
          "Increases flush completions — shifts range equities",
          "Makes board drier",
          "Removes all draws",
          "Ends hand"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — flush draws complete, equities shift.",
          "B": "More draws = wetter.",
          "C": "Draws can complete.",
          "D": "Hand continues."
        },
        "remediation": [
          {
            "id": "pt_pf_q6_r1",
            "question": "Scare card on turn helps bluffs when:",
            "options": [
              "It completes draws you can represent",
              "Board is identical",
              "You never raised preflop",
              "Everyone showed cards"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — story matches board.",
              "B": "Identical board isn't scary.",
              "C": "Preflop action still matters.",
              "D": "Betting before show."
            }
          },
          {
            "id": "pt_pf_q6_r2",
            "question": "Board texture affects:",
            "options": [
              "Which ranges connect and bet sizing",
              "Hand ranking rules",
              "Number of hole cards",
              "Blind amounts"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — connectivity drives strategy.",
              "B": "Rankings fixed.",
              "C": "Two hole cards always.",
              "D": "Blinds pre-hand."
            }
          }
        ]
      },
      {
        "id": "pt_pf_q7",
        "kind": "standard",
        "concept": "check_back",
        "question": "Checking back flop with medium hand often:",
        "options": [
          "Pot controls and avoids bloating pot vs stronger hands",
          "Always wins",
          "Is illegal",
          "Shows cards"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — medium strength prefers cheap showdown.",
          "B": "Doesn't guarantee win.",
          "C": "Checking is legal.",
          "D": "Showdown later."
        },
        "remediation": [
          {
            "id": "pt_pf_q7_r1",
            "question": "Pot control means:",
            "options": [
              "Keeping pot small with marginal hands",
              "Always betting huge",
              "Folding nuts",
              "All-in preflop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — manage pot size.",
              "B": "Opposite of control.",
              "C": "Nuts want value.",
              "D": "Postflop concept."
            }
          },
          {
            "id": "pt_pf_q7_r2",
            "question": "Check back on wet board with one pair:",
            "options": [
              "Reasonable — many turns bad",
              "Mandatory all-in",
              "Must bluff river always",
              "Dealer wins"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — many scare cards ahead.",
              "B": "Not mandatory.",
              "C": "Bluff optional later.",
              "D": "Best hand wins."
            }
          }
        ]
      },
      {
        "id": "pt_pf_q8",
        "kind": "standard",
        "concept": "barrel",
        "question": "Double-barrel means:",
        "options": [
          "Betting flop and turn",
          "Only flop bet",
          "Check-raise preflop",
          "Three hole cards"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — firing twice postflop.",
          "B": "Single barrel is flop only.",
          "C": "Different line.",
          "D": "Two hole cards in Hold'em."
        },
        "remediation": [
          {
            "id": "pt_pf_q8_r1",
            "question": "Second barrel good when:",
            "options": [
              "Turn card improves your story or equity",
              "You have zero fold equity",
              "Board empty",
              "Folded preflop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — scare card or semi-bluff equity.",
              "B": "No fold equity = bad barrel.",
              "C": "Board has cards.",
              "D": "Reached turn."
            }
          },
          {
            "id": "pt_pf_q8_r2",
            "question": "Triple barrel is:",
            "options": [
              "Flop, turn, and river bets",
              "Three preflop raises only",
              "Three side pots",
              "Three boards"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — three postflop streets.",
              "B": "Different from three-bet.",
              "C": "Side pots stack.",
              "D": "One board."
            }
          }
        ]
      },
      {
        "id": "pt_pf_q9",
        "kind": "challenge",
        "concept": "value_bluff_split",
        "question": "River: you have nuts. Betting is:",
        "options": [
          "Value — want calls from worse",
          "Pure bluff",
          "Must check always",
          "Fold"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — extract chips from second-best.",
          "B": "Bluff wants folds; you have best hand.",
          "C": "Nuts bet for value.",
          "D": "Fold forfeits pot."
        },
        "remediation": [
          {
            "id": "pt_pf_q9_r1",
            "question": "River with missed draw, blocker to nuts, scare card:",
            "options": [
              "Possible bluff",
              "Mandatory value bet",
              "Always check nuts",
              "Split automatic"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — classic bluff profile.",
              "B": "Missed draw isn't value.",
              "C": "Nuts bet, not check.",
              "D": "Split only if tied."
            }
          },
          {
            "id": "pt_pf_q9_r2",
            "question": "Same bet size can contain:",
            "options": [
              "Both value and bluffs (mixed strategy)",
              "Only one hand ever",
              "Folded cards",
              "Dealer"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — balance uses same sizes.",
              "B": "Ranges mix hands.",
              "C": "Folded out.",
              "D": "Dealer doesn't bet."
            }
          }
        ]
      },
      {
        "id": "pt_pf_q10",
        "kind": "challenge",
        "concept": "cbet_spot",
        "question": "BTN raises, BB calls. Flop A♠ 8♦ 3♣. Best c-bet plan for BTN:",
        "options": [
          "Small c-bet often — range hits ace, board is dry",
          "Never c-bet",
          "Check-fold always",
          "Pot-size bluff only with 72o always"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct — range advantage and dry board favor frequent small c-bets.",
          "B": "C-betting is standard here.",
          "C": "Too weak — BTN has edge.",
          "D": "Not only 72o; strategy is range-based."
        },
        "remediation": [
          {
            "id": "pt_pf_q10_r1",
            "question": "BB defender range on A-8-3 misses often with:",
            "options": [
              "Low connected hands that didn't flop pair",
              "Every ace always",
              "Nothing ever",
              "Folded preflop"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — many BB hands miss ace-high dry flops.",
              "B": "BB has some ax.",
              "C": "BB always has some hands.",
              "D": "BB defended to see flop."
            }
          },
          {
            "id": "pt_pf_q10_r2",
            "question": "Dry ace-high flop favors preflop aggressor because:",
            "options": [
              "Raiser range includes more big aces and strong hands",
              "Caller always has nuts",
              "Board is wet",
              "Blinds only"
            ],
            "correctAnswer": 0,
            "explanations": {
              "A": "Correct — raiser range hits this texture.",
              "B": "Caller has some aces but wider weak hands.",
              "C": "Dry, not wet.",
              "D": "Both players contest pot."
            }
          }
        ]
      }
    ],
    "placementQuestions": [
      {
        "id": "pt_pf_p1",
        "concept": "cbet",
        "question": "C-bet is:",
        "options": [
          "Preflop raiser bets flop",
          "BB check only",
          "Showdown",
          "Ante"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Different.",
          "C": "Later.",
          "D": "Forced bet."
        }
      },
      {
        "id": "pt_pf_p2",
        "concept": "dry",
        "question": "Dry board:",
        "options": [
          "Few draws",
          "Monotone wet",
          "Always paired",
          "No flop"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Wet.",
          "C": "Can be unpaired.",
          "D": "Flop exists."
        }
      },
      {
        "id": "pt_pf_p3",
        "concept": "wet",
        "question": "Wet board has:",
        "options": [
          "Many draws",
          "No connectivity",
          "Only rags",
          "No betting"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Wet = connected.",
          "C": "Can have high cards.",
          "D": "Still bet."
        }
      },
      {
        "id": "pt_pf_p4",
        "concept": "value",
        "question": "Value bet wants:",
        "options": [
          "Calls from worse",
          "Folds only",
          "Split always",
          "Muck"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Bluff goal.",
          "C": "Tie specific.",
          "D": "Surrender."
        }
      },
      {
        "id": "pt_pf_p5",
        "concept": "bluff",
        "question": "Bluff wants:",
        "options": [
          "Folds from better",
          "Calls from worse",
          "Showdown",
          "Ante"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Value goal.",
          "C": "Avoid showdown.",
          "D": "Separate."
        }
      },
      {
        "id": "pt_pf_p6",
        "concept": "barrel",
        "question": "Double-barrel:",
        "options": [
          "Bet flop and turn",
          "Flop only",
          "Preflop 3-bet",
          "Side pot"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Single barrel.",
          "C": "Different.",
          "D": "Stack related."
        }
      },
      {
        "id": "pt_pf_p7",
        "concept": "check",
        "question": "Check back medium hand:",
        "options": [
          "Pot control",
          "Always win",
          "Illegal",
          "Show cards"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "No guarantee.",
          "C": "Legal.",
          "D": "Later."
        }
      },
      {
        "id": "pt_pf_p8",
        "concept": "texture",
        "question": "Board texture affects:",
        "options": [
          "Range connection and sizing",
          "Hand rank rules",
          "Hole card count",
          "Rake only"
        ],
        "correctAnswer": 0,
        "explanations": {
          "A": "Correct.",
          "B": "Fixed rules.",
          "C": "Always two.",
          "D": "Separate."
        }
      }
    ]
  }
];
