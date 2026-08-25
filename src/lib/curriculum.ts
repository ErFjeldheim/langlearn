export type Vocab = { term: string; translation: string; example?: string };
export type Lesson = {
  id: string;
  day: number;
  title: string;
  topic: string;
  objectives: string[];
  vocab: Vocab[];
  opener: string;
  drillPhrase: string;
};

export function grammarFocus(day: number): string {
  if (day <= 2) return "Greetings, names, and basic question patterns";
  if (day <= 5) return "ser, subject pronouns, articles, and noun gender";
  if (day <= 8) return "ir a + place, dónde, and simple questions";
  if (day <= 10) return "present-tense routines and time expressions";
  if (day <= 14) return "quiero, necesito, quantities, and polite requests";
  if (day <= 16) return "hay, es/está, and classroom questions";
  if (day <= 18) return "tener, hacer, and weather expressions";
  if (day <= 20) return "possessives, negation, and me gusta";
  if (day <= 22) return "present-tense verbs and simple connectors";
  if (day <= 24) return "imperatives, vamos a, and survival phrases";
  return "Integrated review of high-frequency sentence frames";
}

export const CURRICULUM: Lesson[] = [
  {
    id: "greetings",
    day: 1,
    title: "¿Qué onda? — Greetings",
    topic: "Greetings and basic politeness (Mexican informal)",
    objectives: [
      "Greet someone informally and politely",
      "Say your name and ask the other person's name",
      "Use please, thank you, and '¿mande?'",
    ],
    vocab: [
      { term: "hola", translation: "hi" },
      { term: "¿qué onda?", translation: "what's up?" },
      { term: "me llamo", translation: "my name is" },
      { term: "gracias", translation: "thank you" },
      { term: "¿mande?", translation: "pardon? / sorry?" },
    ],
    opener:
      "¡Hola! Qué gusto. Me llamo Sofía. ¿Y tú, cómo te llamas?",
    drillPhrase: "Me llamo Erik, ¿y tú cómo te llamas?",
  },
  {
    id: "goodbyes-time",
    day: 2,
    title: "Adiós — Goodbyes and see you later",
    topic: "Saying goodbye and 'see you'",
    objectives: ["Say goodbye", "Say 'see you later/tomorrow'", "Wish a good day"],
    vocab: [
      { term: "adiós", translation: "goodbye" },
      { term: "hasta luego", translation: "see you later" },
      { term: "hasta mañana", translation: "see you tomorrow" },
      { term: "que tengas buen día", translation: "have a good day" },
    ],
    opener: "Bien, Erik. Ya nos despedimos. ¿Cómo dices 'goodbye' en español?",
    drillPhrase: "Hasta mañana, que tengas buen día",
  },
  {
    id: "numbers-0-20",
    day: 3,
    title: "Números 0–20",
    topic: "Numbers cero to veinte",
    objectives: ["Count 0–20", "Give your age", "Ask someone's age"],
    vocab: [
      { term: "uno, dos, tres", translation: "one, two, three" },
      { term: "diez", translation: "ten" },
      { term: "¿cuántos años tienes?", translation: "how old are you?" },
      { term: "tengo ... años", translation: "I am ... years old" },
    ],
    opener: "Vamos a contar. Uno, dos, tres... ¿Puedes seguir hasta el diez?",
    drillPhrase: "Tengo veintiún años",
  },
  {
    id: "numbers-20-100",
    day: 4,
    title: "Números 20–100",
    topic: "Numbers veinte to cien",
    objectives: ["Count by tens to 100", "Say phone-like numbers", "Ask how much"],
    vocab: [
      { term: "veinte, treinta, cuarenta", translation: "20, 30, 40" },
      { term: "cincuenta", translation: "fifty" },
      { term: "cien", translation: "one hundred" },
      { term: "¿cuánto cuesta?", translation: "how much does it cost?" },
    ],
    opener: "De veinte a cien. Treinta, cuarenta... ¿sigue tú?",
    drillPhrase: "Cuesta cincuenta pesos",
  },
  {
    id: "i-am-student",
    day: 5,
    title: "Soy estudiante — Introducing yourself",
    topic: "Professions, origin, nationality",
    objectives: ["Say you are a student", "Say where you are from", "Say your nationality"],
    vocab: [
      { term: "soy estudiante", translation: "I am a student" },
      { term: "soy de Noruega", translation: "I am from Norway" },
      { term: "noruego", translation: "Norwegian (masc.)" },
      { term: "informática", translation: "informatics / computer science" },
    ],
    opener: "Erik, ¿qué estudias y de dónde eres?",
    drillPhrase: "Soy estudiante de informática, soy de Noruega",
  },
  {
    id: "going-to-mty",
    day: 6,
    title: "Voy a Querétaro — Travel plans",
    topic: "Going to, future with 'ir a'",
    objectives: ["Say where you are going", "Use 'ir a + place'", "Mention Tec de Monterrey"],
    vocab: [
      { term: "voy a Querétaro", translation: "I am going to Querétaro" },
      { term: "en avión", translation: "by plane" },
      { term: "la universidad", translation: "the university" },
      { term: "el Tecnológico de Monterrey", translation: "Tec de Monterrey" },
    ],
    opener: "¿A dónde vas, Erik? ¿Y cómo?",
    drillPhrase: "Voy a Querétaro en avión, al Tecnológico de Monterrey",
  },
  {
    id: "at-airport",
    day: 7,
    title: "En el aeropuerto",
    topic: "Airport: arrival, baggage, where is...",
    objectives: ["Ask where something is", "Find the exit/taxi", "Say you arrived"],
    vocab: [
      { term: "el aeropuerto", translation: "the airport" },
      { term: "¿dónde está...?", translation: "where is...?" },
      { term: "la salida", translation: "the exit" },
      { term: "las maletas", translation: "the suitcases" },
      { term: "acabo de llegar", translation: "I just arrived" },
    ],
    opener: "Estás en el aeropuerto de Querétaro. Necesitas la salida. ¿Qué preguntas?",
    drillPhrase: "¿Dónde está la salida para los taxis?",
  },
  {
    id: "taxi-uber",
    day: 8,
    title: "Un taxi, por favor — Taxi and Uber",
    topic: "Giving an address, asking the price",
    objectives: ["Ask for a taxi", "Give a destination", "Ask the fare"],
    vocab: [
      { term: "un taxi, por favor", translation: "a taxi, please" },
      { term: "voy a...", translation: "I am going to..." },
      { term: "la dirección", translation: "the address" },
      { term: "¿cuánto es?", translation: "how much is it?" },
    ],
    opener: "Vas a tomar un taxi. Dime, ¿a dónde vas y cuánto preguntas?",
    drillPhrase: "Voy a la universidad, ¿cuánto es?",
  },
  {
    id: "days-week",
    day: 9,
    title: "Los días de la semana",
    topic: "Days of the week and 'hoy/mañana'",
    objectives: ["Say the 7 days", "Use 'hoy' and 'mañana'", "Make a simple plan"],
    vocab: [
      { term: "lunes, martes, miércoles", translation: "Monday, Tuesday, Wednesday" },
      { term: "jueves, viernes", translation: "Thursday, Friday" },
      { term: "hoy", translation: "today" },
      { term: "mañana", translation: "tomorrow" },
    ],
    opener: "¿Qué día es hoy, Erik? Y mañana, ¿qué día es?",
    drillPhrase: "Hoy es lunes, mañana es martes",
  },
  {
    id: "time-clock",
    day: 10,
    title: "¿Qué hora es? — Telling time",
    topic: "Asking and telling the hour",
    objectives: ["Ask the time", "Say the time on the hour", "Say 'at what time'"],
    vocab: [
      { term: "¿qué hora es?", translation: "what time is it?" },
      { term: "es la una", translation: "it is one o'clock" },
      { term: "son las dos", translation: "it is two o'clock" },
      { term: "a las ...", translation: "at ... o'clock" },
    ],
    opener: "Erik, ¿qué hora es? Empieza: Son las...",
    drillPhrase: "A las dos de la tarde",
  },
  {
    id: "food-tacos",
    day: 11,
    title: "Tacos, por favor — Street food",
    topic: "Ordering tacos, simple food words",
    objectives: ["Order a couple of tacos", "Say what you want to drink", "Ask for the bill"],
    vocab: [
      { term: "unos tacos, por favor", translation: "some tacos, please" },
      { term: "de pastor", translation: "al pastor (style)" },
      { term: "una agua fresca", translation: "a fresh fruit water" },
      { term: "la cuenta, por favor", translation: "the bill, please" },
    ],
    opener: "Estás en una taquería en Querétaro. ¿Qué vas a pedir?",
    drillPhrase: "Unos tacos de pastor y una agua fresca, por favor",
  },
  {
    id: "food-restaurant",
    day: 12,
    title: "En el restaurante",
    topic: "Sitting down, menu, polite requests",
    objectives: ["Ask for a table", "Ask for the menu", "Order a main dish"],
    vocab: [
      { term: "una mesa para uno", translation: "a table for one" },
      { term: "el menú", translation: "the menu" },
      { term: "quiero...", translation: "I want..." },
      { term: "mesero", translation: "waiter (Mex.)" },
    ],
    opener: "Llegas al restaurante. El mesero te ve. ¿Qué le dices?",
    drillPhrase: "Una mesa para uno y el menú, por favor",
  },
  {
    id: "money-pesos",
    day: 13,
    title: "Pesos y billetes — Money",
    topic: "Paying, prices, 'cuánto cuesta'",
    objectives: ["Ask the price", "Understand pesos/cents", "Pay with cash"],
    vocab: [
      { term: "¿cuánto cuesta?", translation: "how much does it cost?" },
      { term: "los pesos", translation: "pesos (currency)" },
      { term: "en efectivo", translation: "in cash" },
      { term: "tarjeta", translation: "card" },
    ],
    opener: "Quieres pagar. Pregúntame cuánto cuesta el taco.",
    drillPhrase: "¿Cuánto cuesta? Pago en efectivo",
  },
  {
    id: "grocery-store",
    day: 14,
    title: "El supermercado — La Comer / HEB",
    topic: "Grocery shopping, 'where is', quantities",
    objectives: ["Ask where an item is", "Ask for a quantity", "Pay at checkout"],
    vocab: [
      { term: "¿dónde está el...?", translation: "where is the...?" },
      { term: "el pan", translation: "the bread" },
      { term: "la leche", translation: "the milk" },
      { term: "un kilo", translation: "one kilo" },
    ],
    opener: "Estás en el supermercado. Buscas el pan. ¿Qué preguntas?",
    drillPhrase: "¿Dónde está el pan? Un kilo, por favor",
  },
  {
    id: "classmates",
    day: 15,
    title: "Mis compañeros de clase",
    topic: "Classmates, 'who is', basic introductions",
    objectives: ["Introduce a classmate", "Ask 'who is that'", "Say 'nice to meet you'"],
    vocab: [
      { term: "el compañero / la compañera", translation: "the classmate" },
      { term: "mucho gusto", translation: "nice to meet you" },
      { term: "¿quién es?", translation: "who is that?" },
      { term: "igualmente", translation: "likewise" },
    ],
    opener: "Llegas a la clase en el Tec. Hay un compañero nuevo. Preséntate y saluda.",
    drillPhrase: "Mucho gusto, soy Erik, ¿y tú cómo te llamas?",
  },
  {
    id: "classroom-phrases",
    day: 16,
    title: "En la clase — Classroom phrases",
    topic: "Asking the teacher, 'I don't understand'",
    objectives: ["Say you don't understand", "Ask to repeat", "Ask the meaning of a word"],
    vocab: [
      { term: "no entiendo", translation: "I don't understand" },
      { term: "¿puede repetir?", translation: "can you repeat?" },
      { term: "¿qué significa...?", translation: "what does ... mean?" },
      { term: "¿cómo se dice...?", translation: "how do you say...?" },
    ],
    opener: "El profesor habla rápido. ¿Qué le dices para que repita?",
    drillPhrase: "No entiendo, ¿puede repetir, por favor?",
  },
  {
    id: "campus",
    day: 17,
    title: "El campus del Tec",
    topic: "Buildings, library, 'where is the...'",
    objectives: ["Name key campus places", "Ask for directions on campus", "Say 'I need to go to'"],
    vocab: [
      { term: "la biblioteca", translation: "the library" },
      { term: "el aula", translation: "the classroom" },
      { term: "el cafetín", translation: "the campus café (Mex.)" },
      { term: "tengo que ir a...", translation: "I have to go to..." },
    ],
    opener: "Estás en el campus. Necesitas la biblioteca. ¿Qué preguntas?",
    drillPhrase: "Tengo que ir a la biblioteca, ¿dónde está?",
  },
  {
    id: "weather",
    day: 18,
    title: "El clima en Querétaro",
    topic: "Weather, hot/cold, 'hace calor'",
    objectives: ["Describe the weather", "Say it is hot/cold", "Ask about the weather"],
    vocab: [
      { term: "hace calor", translation: "it is hot" },
      { term: "hace frío", translation: "it is cold" },
      { term: "hace sol", translation: "it is sunny" },
      { term: "llueve", translation: "it rains" },
    ],
    opener: "En Querétaro hace calor. Erik, ¿qué tiempo hace hoy?",
    drillPhrase: "Hace mucho calor y sol",
  },
  {
    id: "family",
    day: 19,
    title: "Mi familia",
    topic: "Family members, 'I have a...'",
    objectives: ["Name family members", "Say 'I have a brother/sister'", "Ask about family"],
    vocab: [
      { term: "la familia", translation: "the family" },
      { term: "el hermano / la hermana", translation: "brother / sister" },
      { term: "los papás", translation: "parents (Mex.)" },
      { term: "tengo...", translation: "I have..." },
    ],
    opener: "Erik, ¿tienes hermanos? ¿Cómo es tu familia?",
    drillPhrase: "Tengo una hermana y mis papás viven en Noruega",
  },
  {
    id: "likes-dislikes",
    day: 20,
    title: "Me gusta — Likes and dislikes",
    topic: "Me gusta / no me gusta",
    objectives: ["Say you like something", "Say you don't like something", "Ask if someone likes"],
    vocab: [
      { term: "me gusta", translation: "I like" },
      { term: "no me gusta", translation: "I don't like" },
      { term: "¿te gusta...?", translation: "do you like...?" },
      { term: "el picante", translation: "spicy food" },
    ],
    opener: "¿Te gusta el picante, Erik? A mí me encanta.",
    drillPhrase: "Me gusta el picante, pero no me gusta el calor",
  },
  {
    id: "hobbies",
    day: 21,
    title: "Mis pasatiempos — Hobbies",
    topic: "Free time, sports, 'jugar', 'ver'",
    objectives: ["Name a hobby", "Say what you do on weekends", "Ask about hobbies"],
    vocab: [
      { term: "jugar videojuegos", translation: "to play video games" },
      { term: "ver series", translation: "to watch shows" },
      { term: "el fin de semana", translation: "the weekend" },
      { term: "¿qué haces...?", translation: "what do you do...?" },
    ],
    opener: "¿Qué haces el fin de semana, Erik?",
    drillPhrase: "El fin de semana juego videojuegos y veo series",
  },
  {
    id: "host-family",
    day: 22,
    title: "La familia anfitriona",
    topic: "Living with a host family, politeness",
    objectives: ["Greet the host family", "Offer help", "Ask about house rules"],
    vocab: [
      { term: "la familia anfitriona", translation: "the host family" },
      { term: "¿en qué puedo ayudar?", translation: "how can I help?" },
      { term: "la regla", translation: "the rule" },
      { term: "la casa", translation: "the house" },
    ],
    opener: "Llegas con tu familia anfitriona en Querétaro. Saluda y pregunta una regla de la casa.",
    drillPhrase: "Hola, mucho gusto. ¿En qué puedo ayudar?",
  },
  {
    id: "emergencies",
    day: 23,
    title: "Ayuda — Emergencies",
    topic: "Needing help, 'I need a doctor', calling 911",
    objectives: ["Say you need help", "Say you need a doctor/pharmacy", "Give a basic problem"],
    vocab: [
      { term: "¡ayuda!", translation: "help!" },
      { term: "necesito un doctor", translation: "I need a doctor" },
      { term: "la farmacia", translation: "the pharmacy" },
      { term: "me siento mal", translation: "I feel unwell" },
    ],
    opener: "Erik, no te sientes bien. ¿Qué dices para pedir ayuda?",
    drillPhrase: "Me siento mal, necesito un doctor, por favor",
  },
  {
    id: "social-party",
    day: 24,
    title: "Una fiesta — Social phrases",
    topic: "Going out, 'let's go', informal social",
    objectives: ["Accept an invitation", "Suggest 'let's go'", "React with 'órale'"],
    vocab: [
      { term: "vamos", translation: "let's go" },
      { term: "¿vamos a...?", translation: "shall we go to...?" },
      { term: "órale", translation: "okay / sounds good (Mex.)" },
      { term: "está chido", translation: "it's cool (Mex.)" },
    ],
    opener: "Un amigo te invita a cenar tacos. ¿Qué dices?",
    drillPhrase: "Órale, vamos a cenar tacos, está chido",
  },
  {
    id: "pre-flight-review",
    day: 25,
    title: "¡Listo para volar! — Pre-flight review",
    topic: "Mixed review of essentials before the flight",
    objectives: [
      "Greet, introduce yourself, say where you're going",
      "Order food and pay",
      "Ask for help and directions",
    ],
    vocab: [
      { term: "voy a Querétaro", translation: "I am going to Querétaro" },
      { term: "soy estudiante del Tec", translation: "I am a student at Tec" },
      { term: "¿dónde está...?", translation: "where is...?" },
      { term: "¿cuánto cuesta?", translation: "how much?" },
    ],
    opener:
      "Erik, mañana es tu vuelo. Imagina desde el aeropuerto de Trondheim hasta una taquería en Querétaro. Preséntate conmigo, completa: 'Hola, me llamo Erik, voy a...'",
    drillPhrase: "Hola, me llamo Erik, voy a estudiar al Tec de Monterrey, Campus Querétaro",
  },
];

export function getLesson(id: string): Lesson | undefined {
  return CURRICULUM.find((l) => l.id === id);
}

export function nextLesson(completedIds: string[]): Lesson | undefined {
  return CURRICULUM.find((l) => !completedIds.includes(l.id));
}
