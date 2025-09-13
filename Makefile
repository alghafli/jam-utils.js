# Thanks to Job Vranish (https://spin.atomicobject.com/2016/08/26/makefile-c-projects/)

SRC_DIR := ./src
BUILD_DIR := ./build
TEST_DIR := ./test
BACKUP_DIR := ./backup

TARGET := jam-utils
TARGET_EXT := js
FILES := jam-utils-init.js jam-utils-events.js jam-utils-shortcuts.js jam-utils-calendars.js jam-utils-misc.js jam-utils-define.js

$(BUILD_DIR)/$(TARGET)-min.$(TARGET_EXT): $(BUILD_DIR)/$(TARGET).$(TARGET_EXT)
	echo "creating '$@'"
	uglifyjs "$<" > "$@"

$(BUILD_DIR)/$(TARGET).$(TARGET_EXT): $(BUILD_DIR)
	echo "creating '$@'"
	echo -n > "$@"
	for f in $(FILES) ; do \
	    echo "appending $(SRC_DIR)/$$f" ; \
		cat "$(SRC_DIR)/$$f" >> "$@" ; \
	done

$(BUILD_DIR):
	mkdir -p "$(BUILD_DIR)"

$(BACKUP_DIR):
	mkdir -p "$@"

.PHONY: new-backup clean
new-backup: $(BACKUP_DIR)
	echo "creating backup"
	zip -9 -r "$</`date -Iseconds`.zip" "$(SRC_DIR)" "$(BUILD_DIR)" "$(TEST_DIR)"

clean:
	rm -r "$(BUILD_DIR)"

