function Logo() {
  return (
    <svg
      className="h-6 w-6 mr-2 text-blue-400 transition-all duration-300 hover:rotate-3 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield/Armor icon - flat blue design with tilt + glow on hover */}
      <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" />
    </svg>
  );
}

export default Logo;

