/* global $, Xrm, Mscrm, CrmEncodeDecode */

$(function () {
  "use strict";

  var CrmPowerPane = {
    ApplicationType: {
      DynamicsCRM: "Dynamics CRM",
      Dynamics365: "Dynamics 365",
    },
    Constants: {
      SlideTime: 250,
      NotificationClassPrefix: "crm-power-pane-",
      NotificationTimer: null,
    },
    ThemeSelector: {
      StorageKey: "crm-power-pane-theme",
      Themes: [
        {
          id: "default",
          name: "Default",
          modes: ["dark"],
          dockChips: ["#C8D1FA", "#A7E3A5", "#DAC157"],
          palette: { background: "#111214", label: "#A7E3A5", border: "#2F2F33", status: "#A7E3A5" },
          modePalettes: {
            dark: { background: "#111214", label: "#A7E3A5", border: "#2F2F33", status: "#A7E3A5" },
          },
        },
        {
          id: "dark-matter",
          name: "Dark Matter",
          modes: ["light", "dark"],
          dockChips: ["#CC00FF", "#EE66FF", "#00EE88"],
          palette: { background: "#060410", label: "#EE66FF", border: "#201048", status: "#00EE88" },
          modePalettes: {
            light: { background: "#F8F4FF", label: "#5533AA", border: "#D4C8EE", status: "#0E9966" },
            dark: { background: "#060410", label: "#EE66FF", border: "#201048", status: "#00EE88" },
          },
        },
        {
          id: "velvet-void",
          name: "Velvet Void",
          modes: ["light", "dark"],
          dockChips: ["#FF00AA", "#FFB8EE", "#22DD88"],
          palette: { background: "#08030C", label: "#FFB8EE", border: "#2C1040", status: "#22DD88" },
          modePalettes: {
            light: { background: "#FFF0FA", label: "#8C3A7A", border: "#E0C8DA", status: "#149950" },
            dark: { background: "#08030C", label: "#FFB8EE", border: "#2C1040", status: "#22DD88" },
          },
        },
        {
          id: "plasma-ice",
          name: "Plasma Ice",
          modes: ["light", "dark"],
          dockChips: ["#00EEFF", "#FFAA00", "#00E870"],
          palette: { background: "#04080E", label: "#00EEFF", border: "#182430", status: "#00E870" },
          modePalettes: {
            light: { background: "#F2F8FC", label: "#007A88", border: "#C4D4E0", status: "#0E9048" },
            dark: { background: "#04080E", label: "#00EEFF", border: "#182430", status: "#00E870" },
          },
        },
        {
          id: "aurora-rift",
          name: "Aurora Rift",
          modes: ["light", "dark"],
          dockChips: ["#00FF88", "#FF0080", "#00EE66"],
          palette: { background: "#030C0A", label: "#FF0080", border: "#1A1E28", status: "#00EE66" },
          modePalettes: {
            light: { background: "#F0FEF8", label: "#AA0066", border: "#BCD8CC", status: "#009944" },
            dark: { background: "#030C0A", label: "#FF0080", border: "#1A1E28", status: "#00EE66" },
          },
        },
      ],

      DefaultSelection: {
        theme: "default",
        mode: "dark",
      },

      FindTheme: function (themeId) {
        return this.Themes.filter(function (theme) {
          return theme.id === themeId;
        })[0] || this.Themes[0];
      },

      NormalizeSelection: function (selection) {
        var fallback = {
          theme: this.DefaultSelection.theme,
          mode: this.DefaultSelection.mode,
        };
        var theme = selection && selection.theme ? this.FindTheme(selection.theme) : this.Themes[0];
        var mode = selection && selection.mode ? selection.mode : theme.modes[0];

        if (theme.modes.indexOf(mode) === -1) {
          mode = theme.modes[0];
        }

        fallback.theme = theme.id;
        fallback.mode = mode;
        return fallback;
      },

      LoadSelection: function () {
        try {
          return this.NormalizeSelection(JSON.parse(window.localStorage.getItem(this.StorageKey)));
        } catch (e) {
          return this.NormalizeSelection(null);
        }
      },

      SaveSelection: function (selection) {
        try {
          window.localStorage.setItem("crm-power-pane-theme", JSON.stringify(selection));
        } catch (e) {
          /* Storage can be blocked in embedded contexts. */
        }
      },

      GetPalette: function (theme, mode) {
        if (theme.modePalettes && theme.modePalettes[mode]) {
          return theme.modePalettes[mode];
        }

        return theme.palette;
      },

      ApplySelection: function (selection) {
        var normalized = this.NormalizeSelection(selection);
        var $pane = $("#crm-power-pane");

        $pane.removeClass(function (_index, className) {
          return (className || "")
            .split(/\s+/)
            .filter(function (name) {
              return name.indexOf("crm-power-pane-theme-") === 0 || name.indexOf("crm-power-pane-mode-") === 0;
            })
            .join(" ");
        });

        $pane.addClass("crm-power-pane-theme-" + normalized.theme);
        $pane.addClass("crm-power-pane-mode-" + normalized.mode);
        this.SaveSelection(normalized);
        this.UpdateSelectedState(normalized);
        this.UpdateDockState(normalized);
      },

      UpdateSelectedState: function (selection) {
        var normalized = this.NormalizeSelection(selection);
        var $list = $("#crm-power-pane-theme-list");

        $list.find(".crm-power-pane-theme-row").removeClass("selected");
        $list.find(".crm-power-pane-theme-mode").removeClass("selected").attr("aria-pressed", "false");
        $list
          .find('.crm-power-pane-theme-row[data-theme-id="' + normalized.theme + '"]')
          .addClass("selected")
          .find('.crm-power-pane-theme-mode[data-mode="' + normalized.mode + '"]')
          .addClass("selected")
          .attr("aria-pressed", "true");
      },

      UpdateDockState: function (selection) {
        var normalized = this.NormalizeSelection(selection);
        var theme = this.FindTheme(normalized.theme);
        var palette = this.GetPalette(theme, normalized.mode);
        var $trigger = $("#crm-power-pane-theme-trigger");
        var chips = [palette.label, palette.status, palette.border];

        if (!$trigger.length) {
          return;
        }

        $trigger.addClass("theme-dock");

        if (!$trigger.find(".crm-power-pane-theme-dock-name").length) {
          $trigger.empty().append($("<strong>").text("Theme"));
          $trigger.append($("<span>").addClass("theme-dock-label crm-power-pane-theme-dock-name"));
          [0, 1, 2].forEach(function () {
            $trigger.append($("<span>").addClass("theme-chip").attr("aria-hidden", "true"));
          });
        }

        $trigger.find(".crm-power-pane-theme-dock-name").text(theme.name);
        $trigger.find(".theme-chip").each(function (index) {
          $(this).css("background-color", chips[index] || palette.label);
        });
      },

      RenderList: function () {
        var self = this;
        var $list = $("#crm-power-pane-theme-list").empty();

        this.Themes.forEach(function (theme) {
          var previewMode = theme.modes.indexOf("dark") > -1 ? "dark" : theme.modes[0];
          var palette = self.GetPalette(theme, previewMode);
          var $row = $("<li>")
            .addClass("crm-power-pane-theme-row theme-card")
            .attr("data-theme-id", theme.id);
          var $cardButton = $("<button>")
            .attr("type", "button")
            .addClass("crm-power-pane-theme-name")
            .on("click", function () {
              self.ApplySelection({ theme: theme.id, mode: previewMode });
            });
          var $swatches = $("<span>").addClass("swatches").attr("aria-hidden", "true");
          var $meta = $("<span>").addClass("theme-meta");

          [
            palette.background,
            palette.label,
            palette.status,
            palette.border,
          ].forEach(function (color) {
            $swatches.append($("<span>").css("background-color", color));
          });

          $meta
            .append($("<span>").text("Label"))
            .append($("<span>").text(palette.label));

          $cardButton.append($("<span>").addClass("crm-power-pane-theme-card-title").text(theme.name));
          $cardButton.append($swatches);
          $cardButton.append($meta);

          $row.append($cardButton);

          if (theme.modes.length > 1) {
            var $modeGroup = $("<span>").addClass("crm-power-pane-theme-mode-group");
            [
              { mode: "light", icon: "L", label: "Light mode" },
              { mode: "dark", icon: "D", label: "Dark mode" },
            ].forEach(function (item) {
              $modeGroup.append(
                $("<button>")
                  .attr("type", "button")
                  .attr("aria-label", theme.name + " " + item.label)
                  .attr("aria-pressed", "false")
                  .attr("data-mode", item.mode)
                  .addClass("crm-power-pane-theme-mode")
                  .text(item.icon)
                  .on("click", function () {
                    self.ApplySelection({ theme: theme.id, mode: item.mode });
                  })
              );
            });
            $row.append($modeGroup);
          } else {
            $row.append($("<span>").addClass("crm-power-pane-theme-mode-group"));
          }

          $list.append($row);
        });
      },

      Open: function () {
        $("#crm-power-pane-theme-modal-bg").fadeIn(CrmPowerPane.Constants.SlideTime);
        $("#crm-power-pane-theme-modal").fadeIn(CrmPowerPane.Constants.SlideTime);
        $("#crm-power-pane-theme-trigger").attr("aria-expanded", "true");
        $("#crm-power-pane-theme-modal").find("button").first().focus();
      },

      Close: function () {
        $("#crm-power-pane-theme-modal").fadeOut(CrmPowerPane.Constants.SlideTime);
        $("#crm-power-pane-theme-modal-bg").fadeOut(CrmPowerPane.Constants.SlideTime);
        $("#crm-power-pane-theme-trigger").attr("aria-expanded", "false").focus();
      },

      RegisterEvents: function () {
        var self = this;

        this.RenderList();
        this.ApplySelection(this.LoadSelection());

        $("#crm-power-pane-theme-trigger").on("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.Open();
        });

        $("#crm-power-pane-theme-trigger").on("keydown", function (e) {
          if (e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            e.stopPropagation();
            self.Open();
          }
        });

        $("#crm-power-pane-theme-modal-bg, .crm-power-pane-theme-close").on("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.Close();
        });

        $("#crm-power-pane-theme-modal").on("click", function (e) {
          e.stopPropagation();
        });

        $(document).on("keydown", function (e) {
          if (e.key === "Escape" && $("#crm-power-pane-theme-modal").is(":visible")) {
            self.Close();
          }
        });
      },
    },
    UI: {
      SetText: function ($root, selector, value) {
        var textValue = value == null ? "" : String(value);
        return $root.find(selector).text(textValue);
      },

      CreatePopupLabel: function (label) {
        return $("<span>").addClass("crm-power-pane-popup-input-text").text(String(label) + ":");
      },

      AppendPopupInputRow: function ($popupParameters, label, name, value, includeCopyButton) {
        var $input = $("<input>").attr("type", "text").attr("name", name).val(value == null ? "" : String(value));
        var $row = $("<li>").append(CrmPowerPane.UI.CreatePopupLabel(label)).append($input);

        if (includeCopyButton === true) {
          $row.append($("<span>").addClass("crm-power-pane-copy").text("Copy it!"));
        }

        $popupParameters.append($row);
      },

      AppendPopupLookupRow: function ($popupParameters, label, items) {
        var $lookupList = $("<ul>");
        var $row = $("<li>").append(CrmPowerPane.UI.CreatePopupLabel(label)).append($lookupList);

        (items || []).forEach(function (item) {
          var url =
            Xrm.Page.context.getClientUrl() +
            "/main.aspx?etn=" +
            (item && item.entityType ? item.entityType : "") +
            "&id=" +
            (item && item.id ? item.id : "") +
            "&pagetype=entityrecord";

          var $lookupLink = $("<a>")
            .attr("href", "#")
            .addClass("crm-power-pane-lookup-url")
            .attr("data-url", url)
            .text(item && item.name ? item.name : "");

          $lookupList.append($("<li>").append($lookupLink));
        });

        $popupParameters.append($row);
      },

      ShowNotification: function (message, type, time) {
        window.clearTimeout(CrmPowerPane.Constants.NotificationTimer);

        time = time || 5500;
        type = type || "info";

        var className = CrmPowerPane.Constants.NotificationClassPrefix + type;
        var $notification = $("#crm-power-pane-notification");
        CrmPowerPane.UI.SetText($notification, "span", message);
        $notification.attr("class", "");
        $notification.addClass(className).fadeIn(CrmPowerPane.Constants.SlideTime);

        CrmPowerPane.Constants.NotificationTimer = window.setTimeout(function () {
          $notification.fadeOut(CrmPowerPane.Constants.SlideTime);
        }, time);
      },

      BuildInputPopup: function (header, description, parameters, callback, inlineTransition) {
        inlineTransition = inlineTransition || false;
        var popup = new CrmPowerPane.UI.Popup();

        parameters.forEach(function (p) {
          popup.AddParameter(p.label, p.name, p.defaultValue);
        });

        popup.Header = header;
        popup.Description = description;
        popup.InlineTransition = inlineTransition;
        popup.RetreiveData(callback);
      },

      BuildOutputPopup: function (header, description, parameters) {
        var popup = new CrmPowerPane.UI.Popup();
        parameters.forEach(function (p, i) {
          popup.AddParameter(p.label, i, p.value);
        });
        popup.Header = header;
        popup.Description = description;
        popup.ShowData();
      },

      Popup: function () {
        this.Parameters = {};
        this.Header = null;
        this.Description = null;
        this.InlineTransition = false;

        this.Initialize = function () {
          var $popup = $("#crm-power-pane-popup");
          CrmPowerPane.UI.SetText($popup, "h1", this.Header).toggle(this.Header != null);
          CrmPowerPane.UI.SetText($popup, "p", this.Description).toggle(this.Description != null);
          $popup.find("ul").find("li").remove();

          $popup.off("keyup").on("keyup", function (event) {
            if (event.key === "Enter") {
              $("#crm-power-pane-popup-ok") && $("#crm-power-pane-popup-ok").trigger("click");
            } else if (event.key === "Escape") {
              $("#crm-power-pane-popup-cancel") && $("#crm-power-pane-popup-cancel").trigger("click");
            }
          });

          return $popup;
        };

        this.AddParameter = function (label, name, value) {
          this.Parameters[name] = {
            label: label,
            value: (value === undefined ? null : value),
          };
        };

        this.RetreiveData = function (callback) {
          var $popup = this.Initialize();
          var $popupParameters = $popup.find("ul");

          Object.keys(this.Parameters).forEach(function (key) {
            var p = this.Parameters[key];
            CrmPowerPane.UI.AppendPopupInputRow($popupParameters, p.label, key, p.value, false);
          }, this);

          $popup.fadeIn(CrmPowerPane.Constants.SlideTime);
          $popup.find("input").first().focus();

          var $popupBg = $("#crm-power-pane-popup-bg");
          $popupBg.fadeIn(CrmPowerPane.Constants.SlideTime);

          var transition = this.InlineTransition;

          $("#crm-power-pane-popup-ok")
            .off("click")
            .on("click", { $popupList: $popupParameters, popupObj: this }, function (event) {
              if (transition !== true) {
                $popup.fadeOut(CrmPowerPane.Constants.SlideTime);
                $popupBg.fadeOut(CrmPowerPane.Constants.SlideTime);
              }

              var popupObj = event.data.popupObj;
              var params = popupObj.Parameters;
              var $popupList = event.data.$popupList;

              Object.keys(params).forEach(function (key) {
                params[key].value = $popupList.find("input[name='" + key + "']").val();
              });

              callback(popupObj);
            });
        };

        this.ShowData = function () {
          var $popup = this.Initialize();
          var $popupParameters = $popup.find("ul");

          Object.keys(this.Parameters).forEach(function (key) {
            var p = this.Parameters[key];

            if (Array.isArray(p.value)) {
              CrmPowerPane.UI.AppendPopupLookupRow($popupParameters, p.label, p.value);
            } else {
              CrmPowerPane.UI.AppendPopupInputRow($popupParameters, p.label, key, p.value, true);
            }
          }, this);

          $popup.fadeIn(CrmPowerPane.Constants.SlideTime);
          $popup.find("input").first().focus();

          var $popupBg = $("#crm-power-pane-popup-bg");
          $popupBg.fadeIn(CrmPowerPane.Constants.SlideTime);

          $("#crm-power-pane-popup-ok")
            .off("click")
            .on("click", function () {
              $popup.fadeOut(CrmPowerPane.Constants.SlideTime);
              $popupBg.fadeOut(CrmPowerPane.Constants.SlideTime);
            });
        };
      },

      SetButtonBackgrounds: function () {
        // Reserved for future use if needed. Currently button backgrounds are set via CSS only.
      },
    },

    Utils: {
      PrettifyXml: function (sourceXml) {
        var xmlDoc = new DOMParser().parseFromString(sourceXml, "application/xml");
        var xsltDoc = new DOMParser().parseFromString(
          [
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
            '  <xsl:strip-space elements="*"/>',
            '  <xsl:template match="para[content-style][not(text())]">',
            '    <xsl:value-of select="normalize-space(.)"/>',
            "  </xsl:template>",
            '  <xsl:template match="node()|@*">',
            "    <xsl:copy><xsl:apply-templates select=\"node()|@*\"/></xsl:copy>",
            "  </xsl:template>",
            '  <xsl:output indent="yes"/>',
            "</xsl:stylesheet>",
          ].join("\n"),
          "application/xml"
        );

        var xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xsltDoc);

        var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
        return new XMLSerializer().serializeToString(resultDoc);
      },

      EncodeXmlText: function (text) {
        var sourceText = text == null ? "" : String(text);

        if (
          typeof CrmEncodeDecode !== "undefined" &&
          CrmEncodeDecode &&
          typeof CrmEncodeDecode.CrmXmlEncode === "function"
        ) {
          return CrmEncodeDecode.CrmXmlEncode(sourceText);
        }

        return sourceText
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
      },

      BuildRetrieveMultipleSoapRequest: function (fetchXml) {
        return (
          '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>' +
          '<Execute xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services">' +
          '<request i:type="b:RetrieveMultipleRequest" xmlns:b="http://schemas.microsoft.com/xrm/2011/Contracts" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">' +
          '<b:Parameters xmlns:c="http://schemas.datacontract.org/2004/07/System.Collections.Generic">' +
          "<b:KeyValuePairOfstringanyType>" +
          "<c:key>Query</c:key>" +
          '<c:value i:type="b:FetchExpression"><b:Query>' +
          CrmPowerPane.Utils.EncodeXmlText(fetchXml) +
          "</b:Query></c:value></b:KeyValuePairOfstringanyType></b:Parameters>" +
          '<b:RequestId i:nil="true"/>' +
          "<b:RequestName>RetrieveMultiple</b:RequestName>" +
          "</request>" +
          "</Execute></s:Body></s:Envelope>"
        );
      },

      canNotExecute: function (requireForm) {
        try {
          var xrm = CrmPowerPane.TargetFrame.GetXrm();
          if (!xrm || !xrm.Page) {
            CrmPowerPane.Errors.WrongPageWarning();
            return true;
          }

          if (requireForm && (!xrm.Page.ui || xrm.Page.ui.getFormType() === 0)) {
            CrmPowerPane.Errors.WrongPageWarning();
            return true;
          }

          return false;
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
          return true;
        }
      },

      copyToClipboard: function (text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard
            .writeText(text)
            .then(function () {
              return true;
            })
            .catch(function () {
              return false;
            });
        }

        // Fallback (older environments)
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();

        var ok = false;
        try {
          ok = document.execCommand("copy");
        } catch (e) {
          ok = false;
        }

        ta.remove();
        return Promise.resolve(ok);
      },

      // Used for safe ID selectors (if you ever use special chars)
      escapeId: function (id) {
        if (window.CSS && CSS.escape) return CSS.escape(id);
        return id.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|\/@])/g, "\\$1");
      },

      // Fetch JSON from Dataverse (same-origin)
      fetchJson: function (absoluteUrl) {
        return fetch(absoluteUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
          },
          credentials: "same-origin",
        }).then(function (res) {
          if (!res.ok) {
            return res.text().then(function (t) {
              throw new Error(t || ("HTTP " + res.status));
            });
          }
          return res.json();
        });
      },

      // Fetch JSON from legacy CRM endpoints (same-origin)
      fetchLegacyJson: function (absoluteUrl) {
        return fetch(absoluteUrl, {
          method: "GET",
          headers: {
            Accept: "application/json, text/javascript, */*",
            "X-Requested-With": "XMLHttpRequest",
          },
          credentials: "same-origin",
        }).then(function (res) {
          if (!res.ok) {
            return res.text().then(function (t) {
              throw new Error(t || ("HTTP " + res.status));
            });
          }
          return res.json();
        });
      },
    },

    RegisterjQueryExtensions: function () {
      $.fn.bindFirst = function (name, fn) {
        this.on(name, fn);
        this.each(function () {
          var handlers = $._data(this, "events")[name.split(".")[0]];
          var handler = handlers.pop();
          handlers.splice(0, 0, handler);
        });
      };
    },

    TargetFrame: {
      GetApplicationType: function () {
        var mainBody = document.querySelectorAll("body[scroll=no]");
        var topBar = document.querySelector("div[data-id=topBar]");

        if (mainBody && mainBody.length > 0) return CrmPowerPane.ApplicationType.DynamicsCRM;
        if (topBar) return CrmPowerPane.ApplicationType.Dynamics365;
        return null;
      },

      GetContent: function () {
        try {
          var applicationType = CrmPowerPane.TargetFrame.GetApplicationType();

          if (applicationType === CrmPowerPane.ApplicationType.DynamicsCRM) {
            var visibleFrame = $("iframe").filter(function () {
              return $(this).css("visibility") === "visible";
            })[0];

            return visibleFrame ? visibleFrame.contentWindow : null;
          }

          if (applicationType === CrmPowerPane.ApplicationType.Dynamics365) {
            return window;
          }

          return null;
        } catch (e) {
          CrmPowerPane.Errors.ExecutionError(e);
          return null;
        }
      },

      GetXrm: function () {
        try {
          var content = this.GetContent();
          return content ? content.Xrm : null;
        } catch (e) {
          CrmPowerPane.Errors.ExecutionError(e);
          return null;
        }
      },
    },

    Errors: {
      ExecutionError: function (e) {
        console.error("An error occurred while loading Power Pane.", e);
        $("#crm-power-pane-button").hide();
      },

      WrongPageWarning: function () {
        CrmPowerPane.UI.ShowNotification("You need to open a record form to use this action.", "warning");
      },
    },

    RegisterEvents: function () {
      var Content, Xrm;

      var setContext = function () {
        Content = CrmPowerPane.TargetFrame.GetContent();
        Xrm = CrmPowerPane.TargetFrame.GetXrm();
      };

      var _getObjectTypeCode = function () {
        try {
          var entityName = Xrm.Page.data.entity.getEntityName();
          var objectTypeCode = Xrm.Page.context.getQueryStringParameters().etc;

          // UCI doesn't expose etc param. Fall back to internal API if present.
          if (!objectTypeCode && Xrm.Internal && Xrm.Internal.getEntityCode) {
            try {
              objectTypeCode = Xrm.Internal.getEntityCode(entityName);
            } catch (e) {
              /* ignore */
            }
          }

          return objectTypeCode;
        } catch (e) {
          return null;
        }
      };

      var _getAttributeContainer = function (attributeLogicalName) {
        var $container = Content.$("#" + attributeLogicalName);
        if (!$container.length) {
          $container = Content.$('[data-id="' + attributeLogicalName + '"]');
        }
        return $container;
      };

      var _getLabelElement = function (attributeLogicalName) {
        var $label = Content.$("#" + attributeLogicalName + "_c");
        if (!$label.length) {
          $label = Content.$("label", '[data-id="' + attributeLogicalName + '"]');
        }
        return $label.length ? Content.$($label[0]) : null;
      };

      var _getSelectElement = function (attributeLogicalName) {
        var $select = Content.$("select.ms-crm-SelectBox[attrname=" + attributeLogicalName + "]");
        if (!$select.length) {
          $select = Content.$("select", '[data-id="' + attributeLogicalName + '"]');
        }
        return $select;
      };

      // Ensure Content/Xrm are set before any specific action handler
      $(".crm-power-pane-subgroup").bindFirst("click", function () {
        setContext();
      });

      CrmPowerPane.ThemeSelector.RegisterEvents();

      // Toggle pane
      $(document).on("click", "#crm-power-pane-button", function (e) {
        $(".crm-power-pane-sections").slideToggle(CrmPowerPane.Constants.SlideTime);
        e.stopPropagation();
      });

      // Hide pane on outside click
      $(document).on("click", function () {
        $(".crm-power-pane-sections").delay(100).slideUp(CrmPowerPane.Constants.SlideTime);
      });

      $(window).on("blur", function () {
        $(".crm-power-pane-sections").delay(100).slideUp(CrmPowerPane.Constants.SlideTime);
      });

      $(".crm-power-pane-sections").on("click", function (e) {
        e.stopPropagation();
      });

      // Lookup URLs in popup
      $("#crm-power-pane-popup").on("click", "a.crm-power-pane-lookup-url", function (e) {
        e.preventDefault();
        var url = $(this).data("url");
        if (url) window.open(url, "_blank");
      });

      // Copy button inside popup (modern clipboard w/ fallback)
      $("#crm-power-pane").on("click", ".crm-power-pane-copy", function () {
        var $this = $(this);
        $(".crm-power-pane-copy").removeClass("crm-power-pane-copied").html("Copy it!");
        var text = $this.parent().find("input").val() || "";
        CrmPowerPane.Utils.copyToClipboard(text).then(function (ok) {
          if (ok) $this.addClass("crm-power-pane-copied").html("Copied to clipboard!");
          else $this.html("Copy failed");
        });
      });

      // Popup cancel
      $("#crm-power-pane-popup-cancel").on("click", function () {
        $("#crm-power-pane-popup").fadeOut(CrmPowerPane.Constants.SlideTime);
        $("#crm-power-pane-popup-bg").fadeOut(CrmPowerPane.Constants.SlideTime);
      });

      // General: close pane on action click
      $(".crm-power-pane-subgroup").on("click", function () {
        $(".crm-power-pane-sections").slideUp(CrmPowerPane.Constants.SlideTime);
      });

      // -----------------------
      // Actions
      // -----------------------

      $("#entity-name").on("click", function () {
        try {
          var entityName = Xrm.Page.data.entity.getEntityName();
          var values = [{ label: "Entity Name", value: entityName }];

          var objectTypeCode = _getObjectTypeCode();
          if (!!objectTypeCode) values.push({ label: "Entity Type Code", value: objectTypeCode });

          CrmPowerPane.UI.BuildOutputPopup("Entity info", "Entity schema name of current record.", values);
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#record-id").on("click", function () {
        try {
          CrmPowerPane.UI.BuildOutputPopup("Record id", "Guid of current record.", [
            { label: "Record Id", value: Xrm.Page.data.entity.getId() },
          ]);
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#record-url").on("click", function () {
        try {
          var header = "Record url";
          var description = "Url of current record.";

          var url = [Xrm.Page.context.getClientUrl() + "/main.aspx?"];
          url.push("etn=" + Xrm.Page.data.entity.getEntityName());
          url.push("&id=" + Xrm.Page.data.entity.getId());
          url.push("&pagetype=entityrecord");

          var result = [{ label: "Record Url", value: url.join("") }];

          if (
            Xrm.Utility &&
            Xrm.Utility.getGlobalContext &&
            Xrm.Utility.getGlobalContext().getCurrentAppProperties
          ) {
            Xrm.Utility.getGlobalContext().getCurrentAppProperties().then(function (appDetails) {
              url.splice(1, 0, "appid=" + appDetails.appId + "&");
              result.push({ label: "Record Url for Current Application", value: url.join("") });
              CrmPowerPane.UI.BuildOutputPopup(header, description, result);
            });
          } else {
            CrmPowerPane.UI.BuildOutputPopup(header, description, result);
          }
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#record-properties").on("click", function () {
        try {
          var id = Xrm.Page.data.entity.getId();
          var etc = _getObjectTypeCode();

          if (Content.Mscrm && Content.Mscrm.RibbonActions && Content.Mscrm.RibbonActions.openFormProperties) {
            Content.Mscrm.RibbonActions.openFormProperties(id, etc);
          } else {
            var recordPropertiesUrl =
              Xrm.Page.context.getClientUrl() +
              "/_forms/properties/properties.aspx?dType=1&id=" +
              id +
              "&objTypeCode=" +
              etc;
            var options = { width: 420, height: 505 };

            if (Xrm.Internal && Xrm.Internal.getAllowLegacyDialogsEmbedding && Xrm.Internal.getAllowLegacyDialogsEmbedding()) {
              Xrm.Internal.openLegacyWebDialog(recordPropertiesUrl, options);
            } else if (Xrm.Navigation && Xrm.Navigation.openUrl) {
              Xrm.Navigation.openUrl(recordPropertiesUrl, options);
            } else {
              window.open(recordPropertiesUrl, "_blank");
            }
          }
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#go-to-record").on("click", function () {
        try {
          CrmPowerPane.UI.BuildInputPopup(
            "Go to record",
            "Redirects you to specific record by id.",
            [
              { label: "Entity Schema Name", name: "entityname" },
              { label: "Record Id", name: "recordid" },
            ],
            function (popupObj) {
              var params = popupObj.Parameters;
              if (params.entityname.value && params.recordid.value) {
                var linkProps = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
                linkProps.push("?etn=" + params.entityname.value.toLowerCase());
                linkProps.push("&id=" + params.recordid.value);
                linkProps.push("&pagetype=entityrecord");
                window.open(linkProps.join(""), "_blank");
              } else {
                CrmPowerPane.UI.ShowNotification(
                  "Entity name and record guid are required. Please fill them and try again.",
                  "warning"
                );
              }
            }
          );
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("An error occurred while redirecting to specified record.", "error");
        }
      });

      $("#advanced_find").on("click", function () {
        try {
          var clientUrl = Xrm.Page.context.getClientUrl();
          var advancedFindUrl = new URL(clientUrl + "/main.aspx");
          advancedFindUrl.searchParams.set("pagetype", "advancedfind");

          var runtimeUrl = new URL(window.top.location.href);
          ["appid", "forceUCI"].forEach(function (param) {
            var value = runtimeUrl.searchParams.get(param);
            if (value) {
              advancedFindUrl.searchParams.set(param, value);
            }
          });

          if (Xrm.Page.data && Xrm.Page.data.entity) {
            var entityName = Xrm.Page.data.entity.getEntityName();
            var etc = null;

            try {
              etc = Xrm.Internal && Xrm.Internal.getEntityCode ? Xrm.Internal.getEntityCode(entityName) : null;
            } catch (e) {
              etc = null;
            }

            if (etc) {
              advancedFindUrl.searchParams.set("extraqs", "EntityCode=" + etc);
            }
          }

          window.open(advancedFindUrl.toString(), "_blank");
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("Unable to open Advanced Find.", "error");
        }
      });

      $("#user-info").on("click", async function () {
        try {
          // Note: Keep the legacy 2011 endpoint for behavior compatibility.
          function getUserRoles() {
            var userId = Xrm.Page.context.getUserId();
            var serverUrl = Xrm.Page.context.getClientUrl();
            var query =
              serverUrl +
              "/XRMServices/2011/OrganizationData.svc/SystemUserSet?$select=systemuserroles_association/Name,systemuserroles_association/RoleId&$expand=systemuserroles_association&$filter=SystemUserId eq guid'" +
              userId +
              "'";
            return CrmPowerPane.Utils.fetchLegacyJson(query).then(function (responseData) {
              var requestResults = responseData && responseData.d ? responseData.d : { results: [] };
              var first = requestResults.results && requestResults.results.length ? requestResults.results[0] : null;
              var results =
                first && first.systemuserroles_association && first.systemuserroles_association.results
                  ? first.systemuserroles_association.results
                  : [];
              return results.map(function (r) {
                return { name: r.Name, id: r.RoleId, entityType: "role" };
              });
            });
          }

          function getUserTeams() {
            var userId = Xrm.Page.context.getUserId();
            var serverUrl = Xrm.Page.context.getClientUrl();
            var query =
              serverUrl +
              "/XRMServices/2011/OrganizationData.svc/SystemUserSet?$select=teammembership_association/Name,teammembership_association/TeamId&$expand=teammembership_association&$filter=SystemUserId eq guid'" +
              userId +
              "'";
            return CrmPowerPane.Utils.fetchLegacyJson(query).then(function (responseData) {
              var requestResults = responseData && responseData.d ? responseData.d : { results: [] };
              var first = requestResults.results && requestResults.results.length ? requestResults.results[0] : null;
              var results =
                first && first.teammembership_association && first.teammembership_association.results
                  ? first.teammembership_association.results
                  : [];
              return results.map(function (t) {
                return { name: t.Name, id: t.TeamId, entityType: "team" };
              });
            });
          }

          var userName = Xrm.Page.context.getUserName();
          var userId = Xrm.Page.context.getUserId();
          var userDetails = await Promise.all([getUserRoles(), getUserTeams()]);
          var userRoles = userDetails[0];
          var userTeams = userDetails[1];

          CrmPowerPane.UI.BuildOutputPopup("User Info", "Current user information", [
            { label: "User name", value: userName },
            { label: "User id", value: userId },
            { label: "User Roles", value: userRoles },
            { label: "User Teams", value: userTeams },
          ]);
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("An error occurred while getting the user information.", "error");
        }
      });

      $("#enable-all-fields").on("click", function () {
        try {
          Xrm.Page.ui.controls.forEach(function (c) {
            try {
              c.setDisabled(false);
            } catch (e) {
              /* ignore */
            }
          });
          CrmPowerPane.UI.ShowNotification("All fields are enabled.");
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#show-all-fields").on("click", function () {
        try {
          Xrm.Page.ui.controls.forEach(function (c) {
            try {
              c.setVisible(true);
            } catch (e) {
              /* ignore */
            }
          });

          Xrm.Page.ui.tabs.forEach(function (t) {
            try {
              if (t.setVisible) t.setVisible(true);

              if (t.sections && t.sections.getAll) {
                t.sections.getAll().forEach(function (s) {
                  try {
                    if (s && s.setVisible) s.setVisible(true);
                  } catch (e) {
                    /* ignore */
                  }
                });
              }
            } catch (e) {
              /* ignore */
            }
          });

          CrmPowerPane.UI.ShowNotification("Visibility of all fields updated to visible.");
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#disable-field-requirement").on("click", function () {
        try {
          Xrm.Page.ui.controls.forEach(function (c) {
            try {
              if (c && c.getAttribute && c.getAttribute().setRequiredLevel) {
                c.getAttribute().setRequiredLevel("none");
              }
            } catch (e) {
              /* ignore */
            }
          });
          CrmPowerPane.UI.ShowNotification("Required level of all fields updated to none.");
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#schema-names").on("click", function () {
        try {
          var updateStatus;
          Xrm.Page.ui.controls.forEach(function (a) {
            try {
              if (a && a.setLabel && a.getName) {
                if (!a._$originalLabel) {
                  a._$originalLabel = a.getLabel();
                  a.setLabel(a.getName());
                  updateStatus = "update";
                } else {
                  updateStatus = "rollback";
                  a.setLabel(a._$originalLabel);
                  a._$originalLabel = null;
                }
              }
            } catch (e) {
              /* ignore */
            }
          });

          if (updateStatus === "update") CrmPowerPane.UI.ShowNotification("All labels updated to schema name.");
          else if (updateStatus === "rollback") CrmPowerPane.UI.ShowNotification("Schema name updates rolled back.");
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#schema-names-in-brackets").on("click", function () {
        try {
          var updateStatus;
          Xrm.Page.ui.controls.forEach(function (a) {
            try {
              if (a && a.setLabel && a.getName) {
                if (!a._$originalLabel) {
                  a._$originalLabel = a.getLabel();
                  a.setLabel(a.getLabel() + " [" + a.getName() + "]");
                  updateStatus = "update";
                } else {
                  updateStatus = "rollback";
                  a.setLabel(a._$originalLabel);
                  a._$originalLabel = null;
                }
              }
            } catch (e) {
              /* ignore */
            }
          });

          if (updateStatus === "update") CrmPowerPane.UI.ShowNotification("Added schema names in brackets.");
          else if (updateStatus === "rollback") CrmPowerPane.UI.ShowNotification("Removed schema names in brackets.");
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#schema-names-as-desc").on("click", function () {
        try {
          var responsibleControls = ["standard", "optionset", "lookup", "multiselectoptionset"];
          Xrm.Page.ui.controls.forEach(function (control) {
            if (!control || !control.getControlType) return;
            if (responsibleControls.indexOf(control.getControlType()) === -1) return;

            var attributeLogicalName = control.getName();
            var $label = _getLabelElement(attributeLogicalName);

            if ($label) {
              $label.attr("title", attributeLogicalName);
              $label.off("click").on("click", function () {
                CrmPowerPane.Utils.copyToClipboard(attributeLogicalName).then(function (ok) {
                  if (ok) {
                    CrmPowerPane.UI.ShowNotification(
                      'Copied "' + attributeLogicalName + '" to clipboard.',
                      "success"
                    );
                  } else {
                    CrmPowerPane.UI.ShowNotification("Copying failed. Please copy it yourself.", "error");
                  }
                });
              });
            }
          });

          CrmPowerPane.UI.ShowNotification("Schema name copy mode is activated. Click labels to copy.");
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#show-optionset-values").on("click", function () {
        try {
          var overallStatus = null;

          Xrm.Page.ui.controls.forEach(function (control) {
            if (!control || !control.getControlType) return;
            if (control.getControlType() !== "optionset") return;

            var name = control.getName();
            var $selectBox = _getSelectElement(name);
            var $options = $selectBox ? $selectBox.find("option") : null;

            if (!$options || !$options.length) return;

            for (var i = 0; i < $options.length; i++) {
              var opt = $options[i];
              if (opt.text !== "" && opt.value !== "") {
                var exp = "#" + opt.value + "# ";
                if (opt.text.indexOf(exp) > -1) {
                  opt.text = opt.text.replace(exp, "");
                  opt.title = opt.title.replace(exp, "");
                  overallStatus = "reverted";
                } else {
                  opt.text = exp + opt.text;
                  opt.title = exp + opt.title;
                  overallStatus = "changed";
                }
              }
            }
          });

          if (overallStatus === "changed") {
            CrmPowerPane.UI.ShowNotification("Added option values to all option labels (like #value#).");
          } else if (overallStatus === "reverted") {
            CrmPowerPane.UI.ShowNotification("Removed option values from all option labels.");
          }
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#show-dirty-fields").on("click", function () {
        try {
          Xrm.Page.ui.controls.forEach(function (control) {
            var attr = control && control.getAttribute ? control.getAttribute() : undefined;
            if (attr && attr.getIsDirty && attr.getIsDirty()) {
              var name = control.getName();
              _getAttributeContainer(name).css("background", "#FFFF00");
            }
          });
          CrmPowerPane.UI.ShowNotification("Dirty fields were highlighted.");
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#clear-all-notifications").on("click", function () {
        try {
          Xrm.Page.ui.controls.forEach(function (c) {
            try {
              c.clearNotification();
            } catch (e) {
              /* ignore */
            }
          });
          CrmPowerPane.UI.ShowNotification("Notifications of all fields have been cleared.");
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#refresh-ribbon").on("click", function () {
        try {
          Xrm.Page.ui.refreshRibbon();
          CrmPowerPane.UI.ShowNotification("Ribbon refreshing.");
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#refresh-form").on("click", function () {
        try {
          Xrm.Page.data.refresh();
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      $("#toggle-lookup-links").on("click", function () {
        try {
          var existing = Content.$(".crm-power-pane-lookup-link");
          if (existing.length) {
            existing.remove();
            return;
          }

          Xrm.Page.ui.controls.forEach(function (control) {
            try {
              if (control.getControlType() !== "lookup") return;

              var externalIcon =
                '<svg id="i-external" viewBox="0 0 32 32" width="16" height="16" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M14 9 L3 9 3 29 23 29 23 18 M18 4 L28 4 28 14 M28 4 L14 18" /></svg>';

              var linkId = control.getName() + "-lookup-link";
              var $link = Content.$(
                '<a id="' +
                linkId +
                '" class="crm-power-pane-lookup-link" title="Open this record in a new window" style="cursor:pointer;margin-left:5px">' +
                externalIcon +
                "</a>"
              );

              Content.$("#" + control.getName()).append($link);

              $link.on("click", function () {
                try {
                  var attribute = control.getAttribute().getValue()[0];
                  var url =
                    Xrm.Page.context.getClientUrl() +
                    "/main.aspx?etn=" +
                    attribute.entityType +
                    "&id=" +
                    attribute.id +
                    "&pagetype=entityrecord";
                  window.open(url, "_blank");
                } catch (e) {
                  /* ignore */
                }
              });
            } catch (e) {
              /* ignore */
            }
          });
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      // -----------------------
      // Fill / clear helpers
      // -----------------------

      function getRandomNumber(minValue, maxValue, precision) {
        precision = (precision === undefined || precision === null) ? 0 : precision;
        var min = (minValue === undefined || minValue === null) ? 0 : Number(minValue);
        var max = (maxValue === undefined || maxValue === null) ? (min + 100) : Number(maxValue);
        if (Number.isNaN(min)) min = 0;
        if (Number.isNaN(max) || max < min) max = min + 100;

        var n = min + Math.random() * (max - min);
        return Number(n.toFixed(precision));
      }

      function getRandomString(maxLength, format) {
        var safeMax = Math.max(1, Math.min(Number(maxLength) || 10, 200));
        var fmt = format || "";

        switch (fmt) {
          case "email":
          case "Email":
            return (
              getRandomStringGenerator(Math.min(Math.floor(safeMax / 3), 15), false, true) +
              "@" +
              getRandomStringGenerator(Math.min(Math.floor(safeMax / 3), 10), false, true) +
              "." +
              getRandomStringGenerator(getRandomNumber(2, 3), false, true)
            );
          case "phone":
          case "Phone":
            return getRandomStringGenerator(Math.min(Math.floor(safeMax / 2), 25), true);
          case "url":
          case "URL":
            return (
              "https://www." +
              getRandomStringGenerator(Math.min(Math.floor(safeMax / 2), 20), false, true) +
              "." +
              getRandomStringGenerator(3, false, true)
            );
          default:
            return getRandomStringGenerator(Math.min(safeMax, 50), true);
        }
      }

      function getRandomStringGenerator(maxLength, allowSpaces, forceLowerCase) {
        allowSpaces = !!allowSpaces;
        forceLowerCase = !!forceLowerCase;

        var length = Math.max(1, Math.min(Number(maxLength) || 10, 200));

        var consonants = "bcdfghjklmnpqrstvwxyz";
        var vowels = "aeiou";

        var result = "";
        for (var i = 0; i < length; i++) {
          if (allowSpaces && Math.random() < 0.1 && i < length - 3 && result.slice(-1) !== " ") {
            result += " ";
            continue;
          }

          var last = result.slice(-1);
          var nextIsVowel = consonants.indexOf(last) > -1 || (last === " " && Math.random() < 0.4);

          if (nextIsVowel) result += vowels.charAt(Math.floor(Math.random() * vowels.length));
          else result += consonants.charAt(Math.floor(Math.random() * consonants.length));
        }

        if (forceLowerCase) return result;

        // Capitalize each word
        return result
          .split(" ")
          .map(function (w) {
            if (!w) return "";
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          })
          .join(" ");
      }

      function getRandomDate(format) {
        // Keep values reasonable for Dataverse SQL range, but not extreme.
        var start = new Date(2000, 0, 1);
        var end = new Date(2030, 11, 31);
        var timestamp = getRandomNumber(start.getTime(), end.getTime(), 0);
        var date = new Date(timestamp);

        if (format === "date" || format === "DateOnly") {
          date.setHours(0, 0, 0, 0);
        }
        return date;
      }

      function getRandomOptionSetValue(attribute) {
        var control = Xrm.Page.getControl(attribute.getName());
        if (!control || !control.getOptions) return undefined;
        var options = control.getOptions() || [];
        var valid = options.filter(function (o) {
          return o && o.value !== null && o.value !== -1 && o.text !== "";
        });
        if (!valid.length) return undefined;
        return valid[Math.floor(Math.random() * valid.length)].value;
      }

      function getRandomMultiOptionSetValue(attribute) {
        var control = Xrm.Page.getControl(attribute.getName());
        if (!control || !control.getOptions) return undefined;
        var options = control.getOptions() || [];
        var valid = options.filter(function (o) {
          return o && o.value !== null && o.value !== -1 && o.text !== "";
        });
        if (!valid.length) return undefined;

        // pick 1-3 distinct values
        var count = Math.min(valid.length, Math.floor(getRandomNumber(1, 3, 0)));
        var picked = new Set();
        while (picked.size < count) {
          picked.add(valid[Math.floor(Math.random() * valid.length)].value);
        }
        return Array.from(picked);
      }

      async function setRandomLookupValue(attribute) {
        try {
          var types = attribute.getLookupTypes ? attribute.getLookupTypes() : null;
          if (!types || !types.length) return;

          var entityLogicalName = types[0];

          var meta = await Xrm.Utility.getEntityMetadata(entityLogicalName);
          var primaryIdAttribute = meta.PrimaryIdAttribute;
          var primaryNameAttribute = meta.PrimaryNameAttribute;

          var top = 5;
          var result = await Xrm.WebApi.online.retrieveMultipleRecords(
            entityLogicalName,
            "?$select=" + primaryIdAttribute + "," + primaryNameAttribute + "&$top=" + top
          );

          var entities = (result && result.entities) ? result.entities : [];
          if (!entities.length) return;

          var record = entities[Math.floor(Math.random() * entities.length)];
          if (!record) return;

          var lookup = [
            {
              id: record[primaryIdAttribute],
              name: record[primaryNameAttribute],
              entityType: entityLogicalName,
            },
          ];

          attribute.setValue(lookup);
        } catch (e) {
          // Ignore lookup fill failures (could be permissions / empty table)
          console.warn("Random lookup fill failed:", e);
        }
      }

      function getRandomValueForAttribute(attribute) {
        var type = attribute.getAttributeType ? attribute.getAttributeType() : null;

        switch (type) {
          case "lookup":
            // async
            return undefined;

          case "string":
          case "memo":
            try {
              var maxLength = attribute.getMaxLength ? attribute.getMaxLength() : 50;
              var format = attribute.getFormat ? attribute.getFormat() : "text";
              return getRandomString(maxLength, format);
            } catch (e) {
              return getRandomString(50, "text");
            }

          case "decimal":
          case "double":
          case "money":
          case "integer":
            try {
              var min = attribute.getMin ? attribute.getMin() : 0;
              var max = attribute.getMax ? attribute.getMax() : 100;
              var precision = attribute.getPrecision ? attribute.getPrecision() : 0;
              return getRandomNumber(min, max, precision);
            } catch (e) {
              return getRandomNumber(0, 100, 0);
            }

          case "datetime":
            try {
              var fmt = attribute.getFormat ? attribute.getFormat() : "datetime";
              return getRandomDate(fmt);
            } catch (e) {
              return getRandomDate("datetime");
            }

          case "boolean":
            return false;

          case "optionset":
            return getRandomOptionSetValue(attribute);

          case "multioptionset":
            return getRandomMultiOptionSetValue(attribute);

          default:
            return null;
        }
      }

      $("#clear-all-fields").on("click", function () {
        if (CrmPowerPane.Utils.canNotExecute(true)) return;

        try {
          var attributes = Xrm.Page.data.entity.attributes.get();
          for (var i = 0; i < attributes.length; i++) {
            attributes[i].setValue(null);
          }
          CrmPowerPane.UI.ShowNotification("All fields are cleared", "info");
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("Failed to clear fields.", "error");
        }
      });

      $("#fill-all-fields").on("click", async function () {
        if (CrmPowerPane.Utils.canNotExecute(true)) return;

        try {
          var attributes = Xrm.Page.data.entity.attributes.get();

          for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            var value = attribute.getValue();

            if (value !== null && value !== undefined && value !== "") continue;

            if (attribute.getAttributeType && attribute.getAttributeType() === "lookup") {
              await setRandomLookupValue(attribute);
              continue;
            }

            var randomValue = getRandomValueForAttribute(attribute);
            if (randomValue !== undefined) {
              attribute.setValue(randomValue);
            }
          }

          CrmPowerPane.UI.ShowNotification("All fields are filled", "info");
        } catch (e) {
          console.error(e);
          CrmPowerPane.UI.ShowNotification("Failed to fill fields.", "error");
        }
      });

      $("#required-fields").on("click", function () {
        if (CrmPowerPane.Utils.canNotExecute(true)) return;

        try {
          Xrm.Page.data.entity.attributes.forEach(function (a) {
            try {
              if (a.getRequiredLevel && a.getRequiredLevel() === "required" && !a.getValue()) {
                switch (a.getAttributeType()) {
                  case "memo":
                    a.setValue("memo");
                    break;
                  case "string":
                    if (a.getName && a.getName() === "emailaddress1") a.setValue("test@mail.local");
                    else if (a.getName && a.getName() === "telephone1") a.setValue("+32470000000");
                    else a.setValue(a.getName ? a.getName() : "value");
                    break;
                  case "boolean":
                    a.setValue(false);
                    break;
                  case "datetime":
                    a.setValue(new Date());
                    break;
                  case "decimal":
                  case "double":
                  case "integer":
                  case "money":
                    a.setValue(a.getMin ? a.getMin() : 0);
                    break;
                  case "optionset":
                    var opts = a.getOptions ? a.getOptions() : [];
                    if (opts && opts.length) a.setValue(opts[0].value);
                    break;
                }
              }
            } catch (e) {
              /* ignore per-field */
            }
          });

          CrmPowerPane.UI.ShowNotification("All required fields are filled");
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("An error occurred while filling required fields.", "error");
        }
      });

      // -----------------------
      // Show field value
      // -----------------------
      $("#show-field-value").on("click", function () {
        try {
          if (Xrm.Page.ui.getFormType() === 0) return;

          CrmPowerPane.UI.BuildInputPopup(
            "Show Field Value",
            "Shows the field value on the form.",
            [{ label: "Field Schema Name", name: "fieldname" }],
            function (popupObj) {
              var fieldName = popupObj.Parameters.fieldname.value;
              if (!fieldName) {
                CrmPowerPane.UI.ShowNotification("Field name is required.", "warning");
                return;
              }

              var control = Xrm.Page.getControl(fieldName);
              if (!control || !control.getControlType) {
                CrmPowerPane.UI.ShowNotification("Field not found.", "warning");
                return;
              }

              var controlType = control.getControlType();
              var outputParams = null;

              if (controlType === "optionset") {
                outputParams = [
                  { label: "Selected Option Text", value: control.getAttribute().getText() },
                  { label: "Selected Option Value", value: control.getAttribute().getValue() },
                ];
              } else if (controlType === "lookup") {
                var controlValue = control.getAttribute().getValue();
                controlValue = controlValue && controlValue.length > 0 ? controlValue[0] : null;

                outputParams = [
                  { label: "Name", value: controlValue ? controlValue.name : null },
                  { label: "Id", value: controlValue ? controlValue.id : null },
                  { label: "Entity Name", value: controlValue ? controlValue.entityType : null },
                  { label: "Entity Type Code", value: controlValue ? controlValue.type : null },
                ];
              } else if (controlType === "standard") {
                outputParams = [{ label: "Value", value: control.getAttribute().getValue() }];
              } else {
                outputParams = [{ label: "Value", value: control.getAttribute().getValue() }];
              }

              popupObj.Description =
                "Control type of <b>" +
                control.getLabel() +
                " (" +
                fieldName +
                ")</b> is " +
                controlType +
                ".";
              popupObj.Parameters = {};
              outputParams.forEach(function (p, i) {
                popupObj.AddParameter(p.label, i, p.value);
              });
              popupObj.ShowData();
            },
            true
          );
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      // -----------------------
      // Find field in form
      // -----------------------
      $("#find-field-in-form").on("click", function () {
        try {
          if (Xrm.Page.ui.getFormType() === 0) return;

          CrmPowerPane.UI.BuildInputPopup(
            "Find Field On Form",
            "Finds and focuses a specified field.",
            [{ label: "Field Schema Name", name: "fieldname" }],
            function (popupObj) {
              var fieldName = popupObj.Parameters.fieldname.value;
              if (!fieldName) {
                CrmPowerPane.UI.ShowNotification("Field name is required.", "warning");
                return;
              }

              var control = Xrm.Page.getControl(fieldName);
              if (control && control.setFocus) {
                control.setFocus();
                var hiddenMessage = "";
                if (control.getVisible && control.getVisible() === false) {
                  hiddenMessage = "Control was <b>hidden</b>; it has been made visible.";
                  control.setVisible(true);
                }
                CrmPowerPane.UI.ShowNotification("Focused on the " + fieldName + " field. " + hiddenMessage);
                _getAttributeContainer(control.getName()).css("background", "#FFFF00");
              } else {
                CrmPowerPane.UI.ShowNotification(fieldName + " field could not be found.", "warning");
              }
            }
          );
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      // -----------------------
      // Clone record
      // -----------------------
      $("#clone-record").on("click", function () {
        try {
          var excludedFields = ["createdon", "createdby", "modifiedon", "modifiedby", "ownerid"];
          var collectedFields = [];

          Xrm.Page.data.entity.attributes.forEach(function (a) {
            var name = a.getName();
            var value = a.getValue();

            if (!value) return;
            if (excludedFields.indexOf(name) > -1) return;

            switch (a.getAttributeType()) {
              case "lookup":
                if (a.getLookupTypes && a.getLookupTypes()) {
                  collectedFields.push(name + "=" + value[0].id);
                  collectedFields.push(name + "name=" + value[0].name);
                  if (a.getLookupTypes().length > 1) collectedFields.push(name + "type=" + value[0].entityType);
                }
                break;
              case "datetime":
                collectedFields.push(name + "=" + value.toLocaleDateString());
                break;
              default:
                collectedFields.push(name + "=" + value);
                break;
            }
          });

          var createUrl =
            Xrm.Page.context.getClientUrl() +
            "/main.aspx?etn=" +
            Xrm.Page.data.entity.getEntityName() +
            "&pagetype=entityrecord&extraqs=?" +
            encodeURIComponent(collectedFields.join("&"));

          window.open(createUrl, "_blank", "location=no,menubar=no,status=no,toolbar=no", false);
        } catch (e) {
          CrmPowerPane.Errors.WrongPageWarning();
        }
      });

      // -----------------------
      // FetchXML popup
      // -----------------------
      $("#fetch-xml").on("click", function () {
        var $popupBg = $("#crm-power-pane-popup-bg");
        $popupBg.fadeIn(CrmPowerPane.Constants.SlideTime);
        var $fetchPopup = $("#crm-power-pane-fetchxml-popup");
        $fetchPopup.fadeIn(CrmPowerPane.Constants.SlideTime);

        var activeTabClass = "dynamics-crm-power-pane-active-tab";
        $("#crm-power-pane-fetchxml-popup-container ul li")
          .removeClass(activeTabClass)
          .first()
          .addClass(activeTabClass);

        $(".crm-power-pane-fetchxml-tab").hide().first().show();
      });

      $("#crm-power-pane-fetchxml-popup-container ul li").on("click", function () {
        var activeClass = "dynamics-crm-power-pane-active-tab";
        $("#crm-power-pane-fetchxml-popup-container ul li").removeClass(activeClass);
        $(this).addClass(activeClass);
        var $tabs = $(".crm-power-pane-fetchxml-tab");
        $tabs.hide();
        $tabs.eq($(this).index()).show();
      });

      $("#crm-power-pane-popup-cancel-fetch").on("click", function () {
        $("#crm-power-pane-fetchxml-popup").fadeOut(250);
        $("#crm-power-pane-popup-bg").fadeOut(250);
      });

      $("#crm-power-pane-popup-ok-fetch").on("click", function () {
        var xml = $("#crm-power-pane-tab1 textarea").val();
        if (!xml || xml.trim() === "") return;

        var $resultArea = $("#crm-power-pane-fetchxml-result-area");
        $resultArea.val("").css("color", "#000000");

        var request = CrmPowerPane.Utils.BuildRetrieveMultipleSoapRequest(xml);

        $.ajax({
          type: "POST",
          url: Xrm.Page.context.getClientUrl() + "/XRMServices/2011/Organization.svc/web",
          contentType: "text/xml",
          beforeSend: function (xhr) {
            xhr.setRequestHeader("Accept", "application/xml, text/xml, */*");
            xhr.setRequestHeader(
              "SoapAction",
              "http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute"
            );
          },
          data: request,
          dataType: "text",
          processData: false,
          success: function (data) {
            $resultArea.val(CrmPowerPane.Utils.PrettifyXml(data));
            $("#crm-power-pane-fetchxml-popup-container ul li").eq($resultArea.parent().index()).trigger("click");
          },
          error: function (err) {
            var errorDetails = (err && err.statusText ? err.statusText : "Error") + "\n";
            errorDetails += err && err.responseText ? err.responseText : "";
            $resultArea.val(errorDetails).css("color", "red");
            $("#crm-power-pane-fetchxml-popup-container ul li").eq($resultArea.parent().index()).trigger("click");
          },
        });
      });

      // -----------------------
      // Navigation actions
      // -----------------------
      $("#open-entity-editor").on("click", function () {
        try {
          CrmPowerPane.UI.BuildInputPopup(
            "Open entity editor",
            "Opens entity editor according to the specified entity.",
            [
              {
                label: "Entity Schema Name (optional)",
                name: "entityname",
                defaultValue:
                  Xrm && Xrm.Page && Xrm.Page.data && Xrm.Page.data.entity && Xrm.Page.data.entity.getEntityName
                    ? Xrm.Page.data.entity.getEntityName()
                    : null,
              },
            ],
            function (popupObj) {
              var entityDetail = "";
              var entityName = popupObj.Parameters.entityname.value;

              if (entityName && entityName.trim() !== "") {
                var entityTypeCode = Xrm.Internal && Xrm.Internal.getEntityCode ? Xrm.Internal.getEntityCode(entityName) : "";
                var entitiesCategoryCode = 9801; // undocumented
                entityDetail = "&def_category=" + entitiesCategoryCode + "&def_type=" + entityTypeCode;
              }

              var defaultSolutionId = "{FD140AAF-4DF4-11DD-BD17-0019B9312238}";
              window.open(Xrm.Page.context.getClientUrl() + "/tools/solution/edit.aspx?id=" + defaultSolutionId + entityDetail);
            }
          );
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("An error occurred while redirecting to entity editor.", "error");
        }
      });

      $("#solutions").on("click", function () {
        window.open(Xrm.Page.context.getClientUrl() + "/tools/Solution/home_solution.aspx?etc=7100", "_blank");
      });

      $("#crm-diagnostics").on("click", function () {
        window.open(Xrm.Page.context.getClientUrl() + "/tools/diagnostics/diag.aspx", "_blank");
      });

      $("#performance-center").on("click", function () {
        try {
          if (Mscrm && Mscrm.Performance && Mscrm.Performance.PerformanceCenter) {
            Mscrm.Performance.PerformanceCenter.get_instance().TogglePerformanceResultsVisibility();
          }
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("Performance Center is not available on this page.", "warning");
        }
      });

      $("#go-to-create-form").on("click", function () {
        try {
          CrmPowerPane.UI.BuildInputPopup(
            "Go to create form",
            "Redirects you to the create form of the specified entity.",
            [{ label: "Entity Schema Name", name: "entityname" }],
            function (popupObj) {
              var params = popupObj.Parameters;
              if (params.entityname.value) {
                var linkProps = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
                linkProps.push("?etn=" + params.entityname.value.toLowerCase());
                linkProps.push("&newWindow=true");
                linkProps.push("&pagetype=entityrecord");
                window.open(linkProps.join(""), "_blank");
              } else {
                CrmPowerPane.UI.ShowNotification("Entity name is required. Please fill it and try again.", "warning");
              }
            }
          );
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("An error occurred while redirecting to specified create form.", "error");
        }
      });

      $("#open-legacy-editor").on("click", function () {
        try {
          var params = [Xrm.Page.context.getClientUrl() + "/main.aspx"];
          params.push("?pagetype=formeditor");
          params.push("&appSolutionId={FD140AAF-4DF4-11DD-BD17-0019B9312238}");
          params.push("&etn=" + Xrm.Page.data.entity.getEntityName().toLowerCase());
          params.push("&extraqs=formtype=main");
          params.push("&formId=" + Xrm.Page.ui.formSelector.getCurrentItem().getId());
          window.open(params.join(""), "_blank");
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("An error occurred while redirecting to form editor.", "error");
        }
      });

      $("#open-new-editor").on("click", function () {
        try {
          var clientUrl = Xrm.Utility.getGlobalContext().getClientUrl();
          var endpoint =
            clientUrl +
            "/api/data/v9.0/RetrieveCurrentOrganization(AccessType=Microsoft.Dynamics.CRM.EndpointAccessType'Default')";

          CrmPowerPane.Utils.fetchJson(endpoint)
            .then(function (temp) {
              var environmentId = temp && temp.Detail ? temp.Detail.EnvironmentId : null;
              if (!environmentId) throw new Error("EnvironmentId not found");

              var entityName = Xrm.Page.data.entity.getEntityName().toLowerCase();
              var formId = Xrm.Page.ui.formSelector.getCurrentItem().getId();

              var url =
                "https://make.powerapps.com/e/" +
                environmentId +
                "/s/00000001-0000-0000-0001-00000000009b/entity/" +
                entityName +
                "/form/edit/" +
                formId +
                "?source=powerappsportal";

              window.open(url, "_blank");
            })
            .catch(function (e) {
              console.error(e);
              CrmPowerPane.UI.ShowNotification("Failed to open Maker Portal form editor.", "error");
            });
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("An error occurred while redirecting to form editor.", "error");
        }
      });

      $("#open-webapi").on("click", function () {
        try {
          var apiVersion = Xrm.Utility.getGlobalContext().getVersion();
          var parts = String(apiVersion).split(".");
          var shortVersion = parts.length >= 2 ? parts[0] + "." + parts[1] : apiVersion;

          Xrm.Utility.getEntityMetadata(Xrm.Page.data.entity.getEntityName(), "").then(function (result) {
            var url =
              Xrm.Page.context.getClientUrl() +
              "/api/data/v" +
              shortVersion +
              "/" +
              result.EntitySetName +
              "(" +
              Xrm.Page.data.entity.getId() +
              ")";
            url = url.replace("{", "").replace("}", "");
            window.open(url, "_blank");
          });
        } catch (e) {
          CrmPowerPane.UI.ShowNotification("An error occurred opening the Web API URL for this record.", "error");
        }
      });
    },
  };

  CrmPowerPane.UI.SetButtonBackgrounds();
  CrmPowerPane.RegisterjQueryExtensions();
  CrmPowerPane.RegisterEvents();
});
