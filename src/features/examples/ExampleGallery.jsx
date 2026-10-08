import './examples.css';
import BrandCard from './BrandCard.jsx';
import EventPoster from './EventPoster.jsx';
import FashionLook from './FashionLook.jsx';
import MoviePoster from './MoviePoster.jsx';
import { assignRoles } from './roles.js';

const EXAMPLES = [
  { id: 'movie', caption: 'Movie poster', Art: MoviePoster },
  { id: 'fashion', caption: 'Fashion look', Art: FashionLook },
  { id: 'event', caption: 'Event poster', Art: EventPoster },
  { id: 'brand', caption: 'Business cards', Art: BrandCard },
];

/** "See it in use": mock-ups that apply the final palette to posters, fashion and branding. */
export default function ExampleGallery({ colors }) {
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
