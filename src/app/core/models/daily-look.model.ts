import { ClosetItem } from './closet.model';

export interface WeatherInfo {
  tempCelsius: number;
  city: string;
  condition: string;
  icon: string;
}

export interface DailyLook {
  headline: string;
  reasoning: string;
  weather: WeatherInfo;
  items: ClosetItem[];
}
