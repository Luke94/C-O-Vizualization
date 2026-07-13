export default function FilterInput({ id, value, onChange, placeholder, listId, options, disabled = false }) {
  return (
    <>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        list={disabled ? undefined : listId}
        disabled={disabled}
        autoComplete="off"
      />
      {!disabled ? (
        <datalist id={listId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      ) : null}
    </>
  );
}
