const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5' };
  return (
    <span
      className={`inline-block ${sizes[size]} border-2 border-white/30 border-t-white rounded-full animate-spin ml-2 align-middle`}
    />
  );
};
export default Spinner;
