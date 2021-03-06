/* tooltip.js - tooltip functionality
   requires areacorners.js
*/

(function ($) {
    var m = $.mapster, u = m.utils;
    $.extend(m.defaults, {
        toolTipContainer: '<div class="mapster-tooltip" style="border: 2px solid black; background: #EEEEEE; position:absolute; width:160px; padding:4px; margin: 4px; -moz-box-shadow: 3px 3px 5px #535353; ' +
        '-webkit-box-shadow: 3px 3px 5px #535353; box-shadow: 3px 3px 5px #535353; -moz-border-radius: 6px 6px 6px 6px; -webkit-border-radius: 6px; ' +
        'border-radius: 6px 6px 6px 6px;"></div>',
        showToolTip: false,
        toolTipFade: true,
        toolTipClose: ['area-mouseout'],
        onShowToolTip: null,
        onCreateTooltip: null
    });
    $.extend(m.area_defaults, {
        toolTip: null
    });
    m.MapData.prototype.clearTooltip = function () {
        if (this.activeToolTip) {
            this.activeToolTip.stop().remove();
            this.activeToolTip = null;
            this.activeToolTipID = -1;
        }
        $.each(this._tooltip_events, function (i,e) {
            e.object.unbind(e.event);
        });
    };
   m.MapData.prototype.bindTooltipClose = function (option, event, obj) {
        var event_name = event + '.mapster-tooltip', me = this;
        if ($.inArray(option, this.options.toolTipClose) >= 0) {
            obj.unbind(event_name).bind(event_name, function () {
                me.clearTooltip();
            });
            this._tooltip_events.push(
            {
                object: obj, event: event_name
            });
        }
    };
    // Show tooltip adjacent to DOM element "area"
    m.AreaData.prototype.showTooltip = function () {
        var tooltip, left, top, tooltipCss, corners, areaSrc, container,
                        opts = this.effectiveOptions(),
                        md = this.owner,
                        baseOpts = md.options,
                        template = md.options.toolTipContainer;

        // prevent tooltip from being cleared if it was in progress - area is in the same group

        md.cancelClear=true;
        if (md.activeToolTipID === this.areaId) {

            return;
        }

        if (typeof template === 'string') {
            container = $(template);
        } else {
            container = $(template).clone();
        }

        tooltip = container.html(opts.toolTip).hide();

        md.clearTooltip();

        $(md.image).after(tooltip);
        md.activeToolTip = tooltip;
        md.activeToolTipID = this.areaId;

        u.setOpacity(tooltip[0], 0);
        tooltip.show();
        areaSrc = this.area ? 
            [this.area] :
            $.map(this.areas(),
                function(e) {
                    return e.area;
                });
        corners = u.areaCorners(areaSrc,
                                tooltip.outerWidth(true),
                                tooltip.outerHeight(true));

        // Try to upper-left align it first, if that doesn't work, change the parameters

        left = corners.tt[0];
        top = corners.tt[1];

        tooltipCss = { "left": left + "px", "top": top + "px" };

        if (!tooltip.css("z-index") || tooltip.css("z-index") === "auto") {
            tooltipCss["z-index"] = "2000";
        }
        tooltip.css(tooltipCss).addClass('mapster_tooltip');

        md.bindTooltipClose('area-click', 'click', $(md.map));
        md.bindTooltipClose('tooltip-click', 'click', tooltip);
        // not working properly- closes too soon sometimes
        //md.bindTooltipClose('img-mouseout', 'mouseout', $(md.image));

        if (md.options.toolTipFade) {
            u.fader(tooltip[0], 0, 1, opts.fadeDuration);
        } else {
            u.setOpacity(tooltip[0], 1);
        }

        //"this" will be null unless they passed something to forArea
        u.ifFunction(baseOpts.onShowToolTip, this.area || null,
        {
            toolTip: tooltip,
            areaOptions: opts,
            key: this.key,
            selected: this.isSelected()
        });

    };
    // key is one of: (string) area key: target the area -- will use the largest
    //                (DOM el/jq) area: target specific area
    //                 any falsy value: close the tooltip

    // or you don't care which is used.
    m.impl.tooltip = function (key) {
        return (new m.Method(this,
        function () {
            this.clearTooltip();
        },
        function () {
            if (this.effectiveOptions().toolTip) {
                this.showTooltip();
            }
        },
        { name: 'tooltip',
            args: arguments,
            key: key
        }
    )).go();
    };
} (jQuery));
