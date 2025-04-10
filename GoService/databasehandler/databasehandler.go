package databasehandler

import (
	"GoService/config"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type DatabaseHandler struct {
	dbPool *sql.DB
}

var dbConfig = config.LoadConfig("").DatabaseConnection

func NewHandler() (DatabaseHandler, error) {
	dsn := getDsn()

	var err error
	dbPool, err := sql.Open("mysql", dsn)
	if err != nil {
		return DatabaseHandler{}, nil
	}

	dbPool.SetMaxOpenConns(16)
	dbPool.SetMaxIdleConns(8)
	dbPool.SetConnMaxLifetime(5 * time.Minute)

	if err = dbPool.Ping(); err != nil {
		return DatabaseHandler{}, err
	}

	return DatabaseHandler{dbPool: dbPool}, nil
}

func getDsn() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&loc=Local", dbConfig.User, dbConfig.Password, dbConfig.Host, dbConfig.Port, dbConfig.Database)
}

func (dh *DatabaseHandler) GetPersonIdsBySnils(snils string) ([]int, error) {
	query := "SELECT id FROM Person WHERE SNILS = ? AND retired = 0 AND deleted = 0 AND retiredate IS NULL"
	rows, err := dh.getRows(query, snils)
	if err != nil {
		return []int{}, err
	}
	defer rows.Close()
	
	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return []int{}, err
		}
		ids = append(ids, id)
	}

	if err = rows.Err(); err != nil {
		return []int{}, err
	}

	return ids, nil
} 

func (dh *DatabaseHandler) GetPersonPasswordsBySnils(snils string) ([]string, error) {
	query := "SELECT ecp_password FROM Person WHERE SNILS = ? AND retired = 0 AND deleted = 0 AND retiredate IS NULL"
	rows, err := dh.getRows(query, snils)
	if err != nil {
		return []string{}, err
	}
	defer rows.Close()
	
	var passwords []string
	for rows.Next() {
		var password string 
		if err := rows.Scan(&password); err != nil {
			return []string{}, err
		}
		decryptedPassword, decryptError := DecryptPassword(password)
		if decryptError != nil {
			return []string{}, decryptError
		}
		passwords = append(passwords, decryptedPassword)
	}

	if err = rows.Err(); err != nil {
		return []string{}, err
	}

	seen := make(map[string]bool)
	unique := []string{}
	for _, item := range passwords {
		if !seen[item] {
			seen[item] = true
			unique = append(unique, item)
		}
	}

	return unique, nil
} 

func (dh *DatabaseHandler) getRows(query string, params ...any) (*sql.Rows, error) {
	rows, err := dh.dbPool.Query(query, params...)
	if err != nil {
		return nil, err
	}
	return rows, nil
}