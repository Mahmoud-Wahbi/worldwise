import {
  createContext,
  useEffect,
  useContext,
  useReducer,
  useCallback,
} from "react";
import citiesData from "../../data/cities.json";

const CitiesContext = createContext();
const STORAGE_KEY = "worldwise-cities";

const initialState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true };

    case "cities/loaded":
      return {
        ...state,
        isLoading: false,
        cities: action.payload,
      };

    case "city/loaded":
      return { ...state, isLoading: false, currentCity: action.payload };

    case "city/created":
      return {
        ...state,
        isLoading: false,
        cities: [...state.cities, action.payload],
        currentCity: action.payload,
      };

    case "city/deleted":
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
        currentCity: {},
      };

    case "rejected":
      return { ...state, isLoading: false, error: action.payload };

    default:
      throw new Error("unknown action type");
  }
}

function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity, error }, dispatch] = useReducer(
    reducer,
    initialState,
  );

  useEffect(function () {
    function loadCities() {
      dispatch({ type: "loading" });
      try {
        const storedCities = localStorage.getItem(STORAGE_KEY);
        const data = storedCities
          ? JSON.parse(storedCities)
          : citiesData.cities;
        dispatch({ type: "cities/loaded", payload: data });
      } catch (error) {
        dispatch({
          type: "rejected",
          payload: `There was an error loading cities: ${error.message}`,
        });
      }
    }

    loadCities();
  }, []);

  const getCity = useCallback(
    async function getCity(id) {
      if (+id === currentCity.id) return;

      try {
        dispatch({ type: "loading" });
        const storedCities = localStorage.getItem(STORAGE_KEY);
        const cities = storedCities
          ? JSON.parse(storedCities)
          : citiesData.cities;
        const data = cities.find((city) => city.id === +id);

        if (!data) throw new Error("City not found");

        dispatch({ type: "city/loaded", payload: data });
      } catch (error) {
        dispatch({
          type: "rejected",
          payload: `There was an error loading the city: ${error.message}`,
        });
      }
    },
    [currentCity.id],
  );

  async function createCity(newCity) {
    try {
      dispatch({ type: "loading" });
      const storedCities = localStorage.getItem(STORAGE_KEY);
      const cities = storedCities
        ? JSON.parse(storedCities)
        : citiesData.cities;
      const data = { ...newCity, id: Date.now() };

      localStorage.setItem(STORAGE_KEY, JSON.stringify([...cities, data]));
      dispatch({ type: "city/created", payload: data });
    } catch (error) {
      dispatch({
        type: "rejected",
        payload: `There was an error creating the city: ${error.message}`,
      });
    }
  }

  async function deleteCity(id) {
    try {
      dispatch({ type: "loading" });
      const storedCities = localStorage.getItem(STORAGE_KEY);
      const cities = storedCities
        ? JSON.parse(storedCities)
        : citiesData.cities;

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(cities.filter((city) => city.id !== id)),
      );
      dispatch({ type: "city/deleted", payload: id });
    } catch (error) {
      dispatch({
        type: "rejected",
        payload: `There was an error deleting the city: ${error.message}`,
      });
    }
  }

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        getCity,
        createCity,
        deleteCity,
        error,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined)
    throw new Error("CitiesContext was used outside the cities provider");
  return context;
}

export { CitiesProvider, useCities };
