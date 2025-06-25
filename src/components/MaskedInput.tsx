import React, { useState } from 'react';
import InputMask from 'react-input-mask';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MaskedInputProps {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  className?: string;
  placeholder?: string;
  mask: string;
  type?: 'text' | 'date';
  disabled?: boolean;
}

const MaskedInput: React.FC<MaskedInputProps> = ({
  label,
  id,
  name,
  value,
  onChange,
  required = false,
  error,
  className = '',
  placeholder = '',
  mask,
  type = 'text',
  disabled = false,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
    const formattedDate = format(date, 'dd/MM/yyyy');
    const event = {
      target: {
        name,
        value: formattedDate,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(event);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'date') {
      const value = e.target.value;
      if (value) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [year, month, day] = value.split('-');
          e.target.value = `${day}/${month}/${year}`;
        }
      }
    }
    onChange(e);
    if (type === 'date' && e.target.value) {
      const parsedDate = parse(e.target.value, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        setSelectedDate(parsedDate);
      }
    }
  };

  const generateCalendar = () => {
    if (!showCalendar) return null;

    const today = new Date();
    const currentMonth = selectedDate || today;
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayWeekday = firstDayOfMonth.getDay();

    const days = [];
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = format(today, 'dd/MM/yyyy') === format(date, 'dd/MM/yyyy');
      const isSelected = selectedDate && format(selectedDate, 'dd/MM/yyyy') === format(date, 'dd/MM/yyyy');

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(date)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm
            ${isToday ? 'bg-blue-100 text-blue-600' : ''}
            ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
          `}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={() => {
              const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
              setSelectedDate(newDate);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <span className="font-medium">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            type="button"
            onClick={() => {
              const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
              setSelectedDate(newDate);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day) => (
            <div key={day} className="h-8 w-8 flex items-center justify-center text-sm text-gray-500">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className={`mb-4 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <InputMask
          mask={mask}
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className={`w-full px-3 py-2 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 
          focus:border-indigo-500 transition-all duration-200 ${
            type === 'date' ? 'pr-10' : ''
          }`}
          placeholder={placeholder}
        />
        {type === 'date' && (
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <CalendarIcon size={20} />
          </button>
        )}
        {generateCalendar()}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default MaskedInput;
