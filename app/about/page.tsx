import { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About Vidion',
  description: 'Learn about Vidion — mission, features, team, and technologies.',
};

export default function AboutPage() {
  return <AboutClient />;
}
