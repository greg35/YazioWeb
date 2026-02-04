package service

import (
	"YazioExporter/internal/yazioscraper"
	"YazioExporter/pkg/yzapi"
	"encoding/json"
	"fmt"
	"regexp"
)

type prodExporter struct{}

func NewProductsExporter() *prodExporter {
	return &prodExporter{}
}

func (pe *prodExporter) ExportProductsFromYazioToJson(jsonStr string, yzFactory yzapi.ClientFactory) ([]byte, error) {
	prodIds := getUniqueProdIdsFromJson(jsonStr)
	recipeIds := getUniqueRecipeIdsFromJson(jsonStr)

	prodsJsons := map[string]json.RawMessage{}
	const maxWorkers = 5

	// Scrape Products
	if len(prodIds) > 0 {
		scraper := yazioscraper.NewYazioJsonsScraper[string](prodIds, maxWorkers, yzFactory)
		scraper.Scrape(func(client yzapi.Client, task string) (string, error) {
			return client.GetProduct(task)
		}, func(results map[string]string) {
			for prodId, prodJson := range results {
				prodsJsons[prodId] = json.RawMessage(prodJson)
			}
		})
	}

	// Scrape Recipes
	if len(recipeIds) > 0 {
		scraper := yazioscraper.NewYazioJsonsScraper[string](recipeIds, maxWorkers, yzFactory)
		scraper.Scrape(func(client yzapi.Client, task string) (string, error) {
			return client.GetRecipe(task)
		}, func(results map[string]string) {
			for recipeId, recipeJson := range results {
				prodsJsons[recipeId] = json.RawMessage(recipeJson)
			}
		})
	}

	resultJson, err := json.MarshalIndent(prodsJsons, "", "\t")
	if err != nil {
		return nil, fmt.Errorf("fail to marshal result: %v\n%v", err, prodsJsons)
	}

	return resultJson, nil
}

func getUniqueProdIdsFromJson(jsonStr string) (productIds []string) {
	alreadyFindedProdIds := make(map[string]bool)
	prodIdRe := regexp.MustCompile(`(?m)"product_id"\s*:\s*"(.*?)"`)
	for _, match := range prodIdRe.FindAllStringSubmatch(string(jsonStr), -1) {
		if match[1] != "" {
			if _, alreadyExists := alreadyFindedProdIds[match[1]]; !alreadyExists {
				productIds = append(productIds, match[1])
				alreadyFindedProdIds[match[1]] = true
			}
		}
	}
	return
}

func getUniqueRecipeIdsFromJson(jsonStr string) (recipeIds []string) {
	alreadyFindedRecipeIds := make(map[string]bool)
	recipeIdRe := regexp.MustCompile(`(?m)"recipe_id"\s*:\s*"(.*?)"`)
	for _, match := range recipeIdRe.FindAllStringSubmatch(string(jsonStr), -1) {
		if match[1] != "" {
			if _, alreadyExists := alreadyFindedRecipeIds[match[1]]; !alreadyExists {
				recipeIds = append(recipeIds, match[1])
				alreadyFindedRecipeIds[match[1]] = true
			}
		}
	}
	return
}
