import type { ComponentType } from "react";
import type { SimulationConfig, SimulationType } from "../../content/types";
import { CoinFlip } from "./engines/CoinFlip";
import { Dice } from "./engines/Dice";
import { Spinner } from "./engines/Spinner";
import { ExperimentalProbability } from "./engines/ExperimentalProbability";
import { TwoCoin } from "./engines/TwoCoin";
import { TwoDice } from "./engines/TwoDice";
import { CardMarble } from "./engines/CardMarble";
import { DistributionBuilder } from "./engines/DistributionBuilder";

export type SimulationComponent = ComponentType<{ config: SimulationConfig }>;

export const SIMULATION_REGISTRY: Record<SimulationType, SimulationComponent> = {
  coin_flip: CoinFlip,
  dice: Dice,
  spinner: Spinner,
  experimental_probability: ExperimentalProbability,
  two_coin: TwoCoin,
  two_dice: TwoDice,
  card_marble: CardMarble,
  distribution_builder: DistributionBuilder,
};
