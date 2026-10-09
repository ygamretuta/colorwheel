import './examples.css';
import BrandCard from './BrandCard';
import EventPoster from './EventPoster';
import FashionLook from './FashionLook';
import MoviePoster from './MoviePoster';
import { assignRoles } from './roles';

const EXAMPLES = [
  { id: 'movie', caption: 'Movie poster', Art: MoviePoster },
  { id: 'fashion', caption: 'Fashion look', Art: FashionLook },
  { id: 'event', caption: 'Event poster', Art: EventPoster },
  { id: 'brand', caption: 'Business cards', Art: BrandCard },
];

interface ExampleGalleryProps {
  colors: string[];
}

/** "See it in use": mock-ups that apply the final palette to posters, fashion and branding. */
export default function ExampleGallery({ colors }: ExampleGalleryProps) {
  const roles = assignRoles(colors);
  if (!roles) return null;

  return (
    <section className="examples" aria-label="Your palette in use">
      <h3 className="examples__title">See it in use</h3>
      <ul className="examples__list">
        {EXAMPLES.map(({ id, caption, Art }) => (
          <li key={id} className="examples__item" data-example={id}>
            <figure className="examples__figure">
              <Art roles={roles} />
              <figcaption className="examples__caption">{caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
