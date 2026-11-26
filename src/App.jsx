import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./App.css";
console.log(unknownVariable);

function Search({ onSearch }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim() !== "") {
      onSearch(value);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="search">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Введите название книги..."
      />
      <button type="submit">Найти</button>
    </form>
  );
}

Search.propTypes = {
  onSearch: PropTypes.func.isRequired
};

class BookCard extends React.Component {
  render() {
    const { book, onSelect } = this.props;
    const image = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : "https://placehold.co/150x220?text=No+Cover";

    return (
      <div className="book" onClick={() => onSelect(book)}>
        <img src={image} alt={book.title} />
        <h3>{book.title}</h3>
        <p>{book.author_name ? book.author_name[0] : "Автор неизвестен"}</p>
        <p>Год: {book.first_publish_year || "Не указан"}</p>
        <button type="button">Подробнее</button>
      </div>
    );
  }
}

BookCard.propTypes = {
  book: PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    cover_i: PropTypes.number,
    author_name: PropTypes.arrayOf(PropTypes.string),
    first_publish_year: PropTypes.number
  }).isRequired,
  onSelect: PropTypes.func.isRequired
};

// Подробная информация о книге
function BookDetails({ book, onClose }) {
  const [description, setDescription] = useState("Загрузка...");
  const [rating, setRating] = useState("Нет данных");

  useEffect(() => {
    let active = true;

    async function getDetails() {
      setDescription("Загрузка...");
      setRating("Нет данных");

      try {
        const response = await fetch(`https://openlibrary.org${book.key}.json`);
        if (!response.ok) throw new Error("Ошибка загрузки");

        const data = await response.json();
        if (!active) return;

        let text = data.description;
        if (typeof text === "object" && text !== null) {
          text = text.value;
        }
        setDescription(text || "Описание отсутствует.");

        const ratingResponse = await fetch(
          `https://openlibrary.org${book.key}/ratings.json`
        );

        if (ratingResponse.ok) {
          const ratingData = await ratingResponse.json();
          if (!active) return;

          if (ratingData.summary?.average) {
            setRating(`${ratingData.summary.average.toFixed(1)} / 5`);
          }
        }
      } catch {
        if (active) setDescription("Не удалось загрузить описание.");
      }
    }

    getDetails();
    return () => {
      active = false;
    };
  }, [book]);

  const image = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
    : "https://placehold.co/200x280?text=No+Cover";

  return (
    <div className="details">
      <button type="button" onClick={onClose}>Назад</button>
      <div className="details-content">
        <img src={image} alt={book.title} />
        <div>
          <h2>{book.title}</h2>
          <p><b>Автор:</b> {book.author_name?.join(", ") || "Не указан"}</p>
          <p><b>Год:</b> {book.first_publish_year || "Не указан"}</p>
          <p><b>Рейтинг:</b> {rating}</p>
          <p><b>Описание:</b> {description}</p>
        </div>
      </div>
    </div>
  );
}

BookDetails.propTypes = {
  book: PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    cover_i: PropTypes.number,
    author_name: PropTypes.arrayOf(PropTypes.string),
    first_publish_year: PropTypes.number
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

function App() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchBooks(value) {
    setLoading(true);
    setError("");
    setSelectedBook(null);

    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(value)}&limit=12`
      );

      if (!response.ok) throw new Error("Ошибка загрузки");

      const data = await response.json();
      setBooks(data.docs || []);

      if (!data.docs || data.docs.length === 0) {
        setError("Книги не найдены.");
      }
    } catch {
      setError("Не удалось получить данные. Попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Поиск книг</h1>
      <p className="subtitle">
        Найдите интересующую вас книгу и узнайте о ней больше.
      </p>

      <Search onSearch={searchBooks} />

      {loading && <p className="message">Загрузка...</p>}
      {error && <p className="message">{error}</p>}

      {selectedBook ? (
        <BookDetails
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      ) : (
        <div className="books">
          {books.map((book, index) => (
            <BookCard
              key={book.key + index}
              book={book}
              onSelect={setSelectedBook}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
