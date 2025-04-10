package utils

func RemoveDuplicates(input []string) []string {
	// Используем map для отслеживания уникальных значений
	seen := make(map[string]struct{})
	result := []string{}

	for _, value := range input {
		// Если элемент еще не встречался, добавляем его в результат
		if _, exists := seen[value]; !exists {
			seen[value] = struct{}{} // Добавляем элемент в map
			result = append(result, value)
		}
	}

	return result
}